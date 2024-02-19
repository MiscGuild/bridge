import Bot from "../classes/Bot";
import { BotEvents } from "mineflayer";
import { ClientEvents } from "discord.js";
import regex from "../util/regex";

export interface Event {
	name: keyof typeof regex | keyof BotEvents | keyof ClientEvents;
	runOnce: boolean;
	run: Execute;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Execute = (bot: Bot, ...params: any[]) => Promise<void>;
