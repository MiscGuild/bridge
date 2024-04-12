declare interface Command {
    data: import('discord.js').ChatInputApplicationCommandData;
    run: ExecuteCommand;
    staffOnly?: boolean;
}

type ExecuteCommand = (
    bot: import('@classes/Bot').default,
    interaction: import('discord.js').ChatInputCommandInteraction,
    // TODO: use never[] below and force implementations to define types explicitly (use spread?)
    args: any[]
) => Promise<void>;
