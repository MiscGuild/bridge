import {
    ApplicationCommandOptionType,
    EmbedBuilder,
    type ChatInputCommandInteraction,
    type ColorResolvable,
} from 'discord.js';
import type Bridge from '@/bridge/bridge';

type Handler = (bridge: Bridge, interaction: ChatInputCommandInteraction) => Promise<void>;

interface Subcommand {
    description: string;
    options?: Record<string, unknown>[];
    staffOnly: boolean;
    run: Handler;
}

const userOption = {
    name: 'user',
    description: 'Minecraft username',
    type: ApplicationCommandOptionType.String,
    required: true,
};

/** Runs `/g …` for a member in-game and replies with the result. */
function memberAction(
    command: (user: string, reason: string) => string,
    color: ColorResolvable,
    title: string,
    done: (user: string, reason: string) => string
): Handler {
    return async (bridge, interaction) => {
        const user = interaction.options.getString('user', true);
        const reason = interaction.options.getString('reason') ?? '';
        const embed = new EmbedBuilder();
        try {
            await bridge.bot.executeAndCapture(command(user, reason));
            embed.setColor(color).setTitle(title).setDescription(done(user, reason));
        } catch (e) {
            embed.setColor('Red').setTitle('Error').setDescription(String(e));
        }
        await interaction.reply({ embeds: [embed] });
    };
}

const SUBCOMMANDS: Record<string, Subcommand> = {
    invite: {
        description: 'Invite a player to the guild',
        options: [userOption],
        staffOnly: true,
        run: memberAction(
            (user) => `/g invite ${user}`,
            'Green',
            'Invited!',
            (user) => `\`${user}\` has been invited to the guild!`
        ),
    },
    kick: {
        description: 'Kick a player from the guild',
        options: [
            userOption,
            {
                name: 'reason',
                description: 'Reason for kicking',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
        staffOnly: true,
        run: memberAction(
            (user, reason) => `/g kick ${user} ${reason}`,
            'Red',
            'Kicked!',
            (user, reason) => `\`${user}\` has been kicked for \`${reason}\``
        ),
    },
    promote: {
        description: 'Promote a guild member',
        options: [userOption],
        staffOnly: true,
        run: memberAction(
            (user) => `/g promote ${user}`,
            'Green',
            'Promoted!',
            (user) => `${user} has been promoted!`
        ),
    },
    demote: {
        description: 'Demote a guild member',
        options: [userOption],
        staffOnly: true,
        run: memberAction(
            (user) => `/g demote ${user}`,
            'Red',
            'Demoted!',
            (user) => `${user} has been demoted!`
        ),
    },
    announce: {
        description: 'Broadcast a message to guild chat',
        options: [
            {
                name: 'message',
                description: 'The message to announce',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
        staffOnly: true,
        run: async (bridge, interaction) => {
            const message = interaction.options.getString('message', true);
            bridge.bot.chat('gc', message);
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Green')
                        .setTitle('Announced!')
                        .setDescription(`Sent to guild chat: \`${message}\``),
                ],
            });
        },
    },
    online: {
        description: 'Show current online guild member count',
        staffOnly: false,
        run: async (bridge, interaction) => {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Green')
                        .setTitle('Online Members')
                        .setDescription(
                            `**${bridge.onlineCount - 1}** / **${bridge.totalCount}** guild members online`
                        )
                        .setTimestamp(),
                ],
            });
        },
    },
};

export default {
    data: {
        name: 'guild',
        description: 'Guild commands',
        options: Object.entries(SUBCOMMANDS).map(([name, sub]) => ({
            name,
            description: sub.description,
            type: ApplicationCommandOptionType.Subcommand,
            options: sub.options,
        })),
    },
    run: (bridge: Bridge, interaction: ChatInputCommandInteraction) =>
        SUBCOMMANDS[interaction.options.getSubcommand()]!.run(bridge, interaction),
    staffOnly: Object.entries(SUBCOMMANDS)
        .filter(([, sub]) => sub.staffOnly)
        .map(([name]) => name),
};
