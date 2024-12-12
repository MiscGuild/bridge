import { TextChannel } from 'discord.js';
import env from '../../util/env';

export default {
    name: 'ready',
    runOnce: true,
    run: async (bot) => {
        bot.discord.application?.commands.set(bot.discord.commands.map((command) => command.data));

        bot.memberChannel = (await bot.discord.channels.fetch(
            env.MEMBER_CHANNEL_ID
        )) as TextChannel;
        bot.officerChannel = (await bot.discord.channels.fetch(
            env.OFFICER_CHANNEL_ID
        )) as TextChannel;

        bot.setStatus();
    },
} as Event;
