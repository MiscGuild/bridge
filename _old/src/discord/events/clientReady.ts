import { TextChannel } from 'discord.js';
import env from '../../util/env';

export default {
    name: 'clientReady',
    runOnce: true,
    run: async (bridge) => {
        bridge.discord.application?.commands.set(
            bridge.discord.commands.map((command) => command.data)
        );

        bridge.discord.memberChannel = (await bridge.discord.channels.fetch(
            env.MEMBER_CHANNEL_ID
        )) as TextChannel;
        bridge.discord.officerChannel = (await bridge.discord.channels.fetch(
            env.OFFICER_CHANNEL_ID
        )) as TextChannel;

        bridge.setStatus();
    },
} as BotEvent;
