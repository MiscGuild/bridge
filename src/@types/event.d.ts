declare interface BotEvent {
    name:
        | keyof typeof import('../mineflayer/events/regex').default
        | keyof import('mineflayer').BotEvents
        | keyof import('discord.js').ClientEvents;
    runOnce: boolean;
    run: (bridge: import('../bridge').default, ...params: any[]) => Promise<void>;
}
