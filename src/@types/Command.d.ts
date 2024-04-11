declare interface Command {
	data: import("discord.js").ChatInputApplicationCommandData;
	run: ExecuteCommand;
	staffOnly?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExecuteCommand = (
	bot: import("@classes/Bot").default,
	interaction: import("discord.js").ChatInputCommandInteraction,
	// TODO: use never[] below and force implementations to define types explicitly (use spread?)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	args: any[],
) => Promise<void>;
