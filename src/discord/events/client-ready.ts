import type Bridge from '@/bridge/bridge';
import env from '@/config/env';

export default {
    name: 'clientReady',
    once: true,
    run: async (bridge: Bridge) => {
        bridge.discord.application?.commands.set(
            bridge.discord.commands.map((cmd) => cmd.data)
        );
        await bridge.discord.initChannels();
        bridge.setStatus();
    },
};
