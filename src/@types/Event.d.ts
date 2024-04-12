declare interface Event {
    name:
        | keyof typeof import('@util/regex').default
        | keyof import('mineflayer').BotEvents
        | keyof import('discord.js').ClientEvents;
    runOnce: boolean;
    run: Execute;
}

type Execute = (bot: import('@classes/Bot').default, ...params: any[]) => Promise<void>;
