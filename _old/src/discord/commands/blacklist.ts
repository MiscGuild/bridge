import { ApplicationCommandOptionType, EmbedBuilder, TextChannel } from 'discord.js';
import env from '../../util/env';
import _blacklist from '../../blacklist/_blacklist.json';
import writeToJsonFile from '../../util/write-to-json-file';
import fetchErrorEmbed from '../../requests/fetch-error-embed';
import fetchMojangProfile from '../../requests/fetch-mojang-profile';
import isFetchError from '../../requests/is-fetch-error';

export default {
    data: {
        name: 'blacklist',
        description: 'Add or remove a user from the blacklist!',
        options: [
            {
                name: 'add',
                description: 'Add a user to the blacklist',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'user',
                        description: 'The user to add to the blacklist',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                    {
                        name: 'end',
                        description: 'The end date of the blacklist',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                    {
                        name: 'reason',
                        description: 'The reason for the blacklist',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                ],
            },
            {
                name: 'remove',
                description: 'Removes a user from the blacklist',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'user',
                        description: 'The user to remove from the blacklist',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                ],
            },
        ],
    },
    run: async (bridge, interaction, args) => {
        const type = interaction.options.getSubcommand() as 'add' | 'remove';
        const mojangProfile = await fetchMojangProfile(args[0] as string);

        // Handle both old array format and new object format
        const blacklistData = _blacklist as any;
        const blacklist = Array.isArray(blacklistData) ? blacklistData : blacklistData.bans || [];

        if (isFetchError(mojangProfile)) {
            const embed = fetchErrorEmbed(mojangProfile);
            await interaction.reply({ embeds: [embed] });
            return;
        }

        const isOnBlacklist = blacklist.some(
            (user: BlacklistEntry) => user.uuid === mojangProfile.id
        );
        if ((type === 'add' && isOnBlacklist) || (type === 'remove' && !isOnBlacklist)) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('Error')
                .setDescription(
                    `That user is ${type === 'add' ? 'already' : 'not'} on the blacklist!`
                );

            await interaction.reply({ embeds: [embed] });
            return;
        }

        if (type === 'add') {
            const endDate = args[1] as string;
            const reason = args[2] as string;
            const embed = new EmbedBuilder()
                .setAuthor({ name: 'Blacklist' })
                .setColor('Red')
                .setFooter({ text: mojangProfile.id })
                .setThumbnail(`https://visage.surgeplay.com/full/${mojangProfile.id}.png`)
                .setTimestamp()
                .setTitle(mojangProfile.name)
                .setURL(`http://plancke.io/hypixel/player/stats/${mojangProfile.id}`)
                .addFields([
                    { name: 'End:', value: endDate },
                    { name: 'Reason:', value: reason },
                ]);

            const blacklistMessage = await (
                (await bridge.discord.channels.fetch(env.BLACKLIST_CHANNEL_ID)) as TextChannel
            ).send({
                embeds: [embed],
            });

            blacklist.push({
                name: mojangProfile.name,
                uuid: mojangProfile.id,
                endDate,
                reason,
                messageId: blacklistMessage.id,
                bannedBy: interaction.user.username,
                bannedAt: new Date().toISOString(),
                type: 'guild',
            });
        } else {
            const blacklistEntry = blacklist.find(
                (user: BlacklistEntry) => user.uuid === mojangProfile.id
            )!;
            blacklist.splice(blacklist.indexOf(blacklistEntry), 1);

            const message = await (
                bridge.discord.channels.cache.get(env.BLACKLIST_CHANNEL_ID) as TextChannel
            ).messages.fetch(blacklistEntry.messageId);
            await message.delete();
        }

        const successEmbed = new EmbedBuilder()
            .setColor(type === 'add' ? 'Red' : 'Green')
            .setThumbnail(`https://crafatar.com/avatars/${mojangProfile.id}`)
            .setTitle('Completed!')
            .setDescription(
                `${mojangProfile.name} was ${
                    type === 'add' ? 'added to' : 'removed from'
                } the blacklist!`
            );

        // Write in new format
        writeToJsonFile(
            './src/blacklist/_blacklist.json',
            { bans: blacklist },
            interaction,
            successEmbed
        );
    },
    staffOnly: true,
} as Command;
