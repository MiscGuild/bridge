declare interface Event {
    name:
        | keyof typeof import('@events/regex').default
        | keyof import('mineflayer').BotEvents
        | keyof import('discord.js').ClientEvents;
    runOnce: boolean;
    run: Execute;
}

type Execute = (bot: import('@classes/bot').default, ...params: any[]) => Promise<void>;
