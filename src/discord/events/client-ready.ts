import type Bridge from '@/bridge/bridge';

export default {
    name: 'clientReady',
    once: true,
    run: async (bridge: Bridge) => {
        bridge.discord.application?.commands.set(bridge.discord.commands.map((cmd) => cmd.data));
        await bridge.discord.initChannels();
        bridge.setStatus();
    },
};
