declare interface Event {
	name:
		| keyof typeof import("@util/regex").default
		| keyof import("mineflayer").BotEvents
		| keyof import("discord.js").ClientEvents;
	runOnce: boolean;
	run: Execute;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Execute = (bot: import("@classes/Bot").default, ...params: any[]) => Promise<void>;
