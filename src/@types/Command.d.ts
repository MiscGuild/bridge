declare interface Command {
    data: import('discord.js').ChatInputApplicationCommandData;
    run: ExecuteCommand;
    staffOnly?: boolean;
}

type ExecuteCommand = (
    bot: import('@classes/bot').default,
    interaction: import('discord.js').ChatInputCommandInteraction,
    args: unknown[]
) => Promise<void>;
