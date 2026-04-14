import {
    ApplicationCommandOptionType,
    EmbedBuilder,
    AttachmentBuilder,
} from 'discord.js';
import type Bridge from '@/bridge/bridge';
import { gexpHistoryRepo } from '@/db/repositories/gexp-history.repo';
import { mojangService } from '@/services/mojang';
import { hypixelService } from '@/services/hypixel';
import env from '@/config/env';
import { renderPlayerGexpChart, renderLeaderboardChart } from '@/utils/gexp-chart';

function daysAgo(n: number): string {
    return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}

function today(): string {
    return new Date().toISOString().slice(0, 10);
}

function fmtNum(n: number): string {
    return n.toLocaleString('en-US');
}

export default {
    data: {
        name: 'gexp',
        description: 'View GEXP history and leaderboard with graphs',
        options: [
            {
                name: 'player',
                description: 'View a player\'s GEXP history graph',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'username',
                        description: 'Minecraft username',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                    {
                        name: 'days',
                        description: 'Number of days to show (default: 7, max: 30)',
                        type: ApplicationCommandOptionType.Integer,
                        required: false,
                        minValue: 1,
                        maxValue: 30,
                    },
                ],
            },
            {
                name: 'leaderboard',
                description: 'View guild GEXP leaderboard with graph',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'days',
                        description: 'Period in days (default: 7, max: 30)',
                        type: ApplicationCommandOptionType.Integer,
                        required: false,
                        minValue: 1,
                        maxValue: 30,
                    },
                    {
                        name: 'top',
                        description: 'Number of players to show (default: 10, max: 25)',
                        type: ApplicationCommandOptionType.Integer,
                        required: false,
                        minValue: 1,
                        maxValue: 25,
                    },
                ],
            },
            {
                name: 'sync',
                description: 'Force-sync GEXP data from Hypixel API now',
                type: ApplicationCommandOptionType.Subcommand,
            },
        ],
    },
    run: async (bridge: Bridge, interaction: any) => {
        const sub = interaction.options.getSubcommand() as 'player' | 'leaderboard' | 'sync';

        try {
            if (sub === 'player') {
                await handlePlayer(bridge, interaction);
            } else if (sub === 'leaderboard') {
                await handleLeaderboard(interaction);
            } else if (sub === 'sync') {
                await handleSync(bridge, interaction);
            }
        } catch (e) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('Error')
                .setDescription(`${e}`);
            if (interaction.deferred) {
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    },
    staffOnly: false,
};

async function handlePlayer(_bridge: Bridge, interaction: any): Promise<void> {
    await interaction.deferReply();

    const username = interaction.options.getString('username', true);
    const days = interaction.options.getInteger('days') ?? 7;

    const profile = await mojangService.getProfile(username);
    if (!profile) {
        await interaction.editReply({
            embeds: [new EmbedBuilder().setColor('Red').setDescription(`Player not found: **${username}**`)],
        });
        return;
    }

    const startDate = daysAgo(days);
    const endDate = today();
    const history = await gexpHistoryRepo.getPlayerHistory(profile.id, startDate, endDate);

    if (history.length === 0) {
        await interaction.editReply({
            embeds: [new EmbedBuilder().setColor('Yellow').setDescription(
                `No GEXP data found for **${profile.name}** in the last ${days} days.\nRun \`/gexp sync\` to fetch fresh data.`,
            )],
        });
        return;
    }

    const totalGexp = history.reduce((sum, r) => sum + r.gexp_earned, 0);
    const avgGexp = Math.round(totalGexp / history.length);
    const maxDay = history.reduce((best, r) => r.gexp_earned > best.gexp_earned ? r : best, history[0]!);

    const chartData = history.map(r => ({ date: r.date, gexp: r.gexp_earned }));
    const chartBuffer = await renderPlayerGexpChart(profile.name, chartData);
    const attachment = new AttachmentBuilder(chartBuffer, { name: 'gexp.png' });

    const embed = new EmbedBuilder()
        .setColor('#5865f2')
        .setTitle(`📊 GEXP History — ${profile.name}`)
        .setThumbnail(`https://mc-heads.net/avatar/${profile.id}/64`)
        .addFields(
            { name: 'Period', value: `${history.length} days`, inline: true },
            { name: 'Total', value: fmtNum(totalGexp), inline: true },
            { name: 'Daily Avg', value: fmtNum(avgGexp), inline: true },
            { name: 'Best Day', value: `${maxDay.date} (${fmtNum(maxDay.gexp_earned)})`, inline: true },
        )
        .setImage('attachment://gexp.png')
        .setFooter({ text: 'Data from Hypixel API • synced periodically' });

    await interaction.editReply({ embeds: [embed], files: [attachment] });
}

async function handleLeaderboard(interaction: any): Promise<void> {
    await interaction.deferReply();

    const days = interaction.options.getInteger('days') ?? 7;
    const top = interaction.options.getInteger('top') ?? 10;

    const startDate = daysAgo(days);
    const endDate = today();
    const entries = await gexpHistoryRepo.getLeaderboard(startDate, endDate, top);

    if (entries.length === 0) {
        await interaction.editReply({
            embeds: [new EmbedBuilder().setColor('Yellow').setDescription(
                'No GEXP data available. Run `/gexp sync` to fetch data.',
            )],
        });
        return;
    }

    const title = `GEXP Leaderboard — Last ${days} day${days > 1 ? 's' : ''}`;
    const chartBuffer = await renderLeaderboardChart(entries, title);
    const attachment = new AttachmentBuilder(chartBuffer, { name: 'leaderboard.png' });

    const lines = entries.map((e, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `\`${i + 1}.\``;
        return `${medal} **${e.username}** — ${fmtNum(e.total)}`;
    });

    const guildTotal = entries.reduce((sum, e) => sum + e.total, 0);

    const embed = new EmbedBuilder()
        .setColor('#5865f2')
        .setTitle(`🏆 ${title}`)
        .setDescription(lines.join('\n'))
        .addFields({ name: 'Guild Total', value: fmtNum(guildTotal), inline: true })
        .setImage('attachment://leaderboard.png')
        .setFooter({ text: 'Data from Hypixel API • synced periodically' });

    await interaction.editReply({ embeds: [embed], files: [attachment] });
}

async function handleSync(bridge: Bridge, interaction: any): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    // Fetch guild directly by name — no need to resolve the bot's Mojang profile
    const guildName = env.HYPIXEL_GUILD_NAME;
    if (!guildName) {
        await interaction.editReply({ content: '❌ HYPIXEL_GUILD_NAME not configured.' });
        return;
    }

    const guild = await hypixelService.getGuildByName(guildName);
    if (!guild) {
        await interaction.editReply({ content: '❌ Could not fetch guild data.' });
        return;
    }

    const { syncGexpFromGuild } = await import('@/modules/gexp-history/index');
    const count = await syncGexpFromGuild(guild, bridge);
    await interaction.editReply({ content: `✅ Synced GEXP for **${count}** members.` });
}
