import type Bridge from '@/bridge/bridge';
import type { ParsedChatEvent } from '@/bot/chat-parser';
import { mojangService } from '@/services/mojang';
import { guildMembersRepo } from '@/db/repositories/guild-members.repo';
import { hypixelService } from '@/services/hypixel';
import { consola } from 'consola';

/** Called from bridge for every parsed event — passively track join/leave/kick/promote */
export async function trackGuildEvent(event: ParsedChatEvent, _bridge: Bridge): Promise<void> {
    switch (event.type) {
        case 'memberJoinLeave': {
            if (event.status === 'joined') {
                const profile = await mojangService.getProfile(event.playerName).catch(() => null);
                if (profile) {
                    await guildMembersRepo.upsert(profile.id, profile.name, null).catch(() => {});
                }
            } else if (event.status === 'left') {
                // Look up UUID to call markLeft
                const profile = await mojangService.getProfile(event.playerName).catch(() => null);
                if (profile) {
                    await guildMembersRepo.markLeft(profile.id).catch(() => {});
                }
            }
            break;
        }
        case 'memberKick': {
            const profile = await mojangService.getProfile(event.playerName).catch(() => null);
            if (profile) await guildMembersRepo.markLeft(profile.id).catch(() => {});
            break;
        }
        case 'promoteDemote': {
            const profile = await mojangService.getProfile(event.playerName).catch(() => null);
            if (profile) await guildMembersRepo.updateRank(profile.id, event.toRank ?? '').catch(() => {});
            break;
        }
    }
}

/** Called periodically to sync the full guild member list */
export async function syncGuildMembers(_bridge: Bridge): Promise<void> {
    try {
        // Use bot's own in-game name to find the guild
        // The bot's MC username is stored in env; we need to get the UUID via Mojang
        const botName = (process.env.MINECRAFT_BOT_NAME ?? process.env.MINECRAFT_EMAIL ?? '').split('@')[0];
        if (!botName) return;

        const botProfile = await mojangService.getProfile(botName).catch(() => null);
        if (!botProfile) return;

        const guild = await hypixelService.getGuild(botProfile.id);
        if (!guild) return;

        for (const member of guild.members) {
            const profile = await mojangService.getByUuid(member.uuid).catch(() => null);
            if (!profile) continue;

            await guildMembersRepo.upsert(member.uuid, profile.name, member.rank).catch(() => {});
        }

        consola.info(`Guild member sync complete: ${guild.members.length} members`);
    } catch (err) {
        consola.error('Guild member sync failed:', err);
    }
}
