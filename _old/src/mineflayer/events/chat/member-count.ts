export default {
    name: 'chat:memberCount',
    runOnce: false,
    run: (bridge, type: 'Online' | 'Total', count: number) => {
        if (type === 'Online') {
            bridge.onlineCount = count;
        } else {
            bridge.totalCount = count;
        }

        bridge.setStatus();
    },
} as BotEvent;
