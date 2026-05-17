import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import type Bridge from '@/bridge/bridge';
import { hypixelService } from '@/services/hypixel';
import { mojangService } from '@/services/mojang';
import { nextCalc } from '@/modules/next-calc/index';

export default {
    data: {
        name: 'next',
        description: 'BedWars "next" calculators',
        options: [
            {
                name: 'level',
                description: 'XP & games needed to reach a target BedWars level (star)',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'ign',
                        description: 'Minecraft username',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                    {
                        name: 'levelwanted',
                        description: 'Target BedWars star',
                        type: ApplicationCommandOptionType.Integer,
                        required: true,
                        minValue: 1,
                    },
                    {
                        name: 'avg_exp',
                        description: 'Average BedWars XP per game (default 150)',
                        type: ApplicationCommandOptionType.Integer,
                        required: false,
                        minValue: 1,
                    },
                ],
            },
        ],
    },
    run: async (_bridge: Bridge, interaction: any) => {
        const sub = interaction.options.getSubcommand() as 'level';
        if (sub !== 'level') {
            await interaction.reply({ content: 'Unknown subcommand.', ephemeral: true });
            return;
        }

        await interaction.deferReply();

        const ign = interaction.options.getString('ign', true);
        const target = interaction.options.getInteger('levelwanted', true);
        const avgXp = interaction.options.getInteger('avg_exp') ?? 150;

        const profile = await mojangService.getProfile(ign);
        if (!profile) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription(`Player not found: **${ign}**`),
                ],
            });
            return;
        }

        const player = await hypixelService.getPlayer(profile.id);
        if (!player) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription(`Could not fetch Hypixel data for **${profile.name}**`),
                ],
            });
            return;
        }

        const stats = nextCalc.bwOverall(player);
        const currentXp = stats.xp;
        const targetXp = nextCalc.xpForLevel(target);
        const neededXp = Math.max(0, targetXp - currentXp);
        const games = Math.ceil(neededXp / Math.max(1, avgXp));

        const embed = new EmbedBuilder()
            .setColor(target <= stats.lvl ? 'Yellow' : '#5865f2')
            .setTitle(`BedWars — Next Level`)
            .setDescription(
                target <= stats.lvl
                    ? `**${profile.name}** is already at ★${stats.lvl} (target ★${target}).`
                    : `**${profile.name}** needs to reach ★${target}.`
            )
            .addFields(
                { name: 'Current Star', value: `★${stats.lvl}`, inline: true },
                { name: 'Target Star', value: `★${target}`, inline: true },
                { name: 'Avg XP / game', value: avgXp.toLocaleString(), inline: true },
                {
                    name: 'Current XP',
                    value: currentXp.toLocaleString(),
                    inline: true,
                },
                {
                    name: 'Target XP',
                    value: targetXp.toLocaleString(),
                    inline: true,
                },
                {
                    name: 'XP Needed',
                    value: neededXp.toLocaleString(),
                    inline: true,
                },
                {
                    name: 'Games Needed',
                    value: target <= stats.lvl ? '0' : games.toLocaleString(),
                    inline: false,
                }
            )
            .setFooter({ text: 'XP/game assumes no quest bonuses.' });

        await interaction.editReply({ embeds: [embed] });
    },
    staffOnly: false,
};
