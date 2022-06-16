import Bot from "../classes/Bot";
import regex from "../util/Regex";
import { BotEvents } from "mineflayer";
import { ClientEvents } from "discord.js";

export interface Event {
	name: keyof typeof regex | keyof BotEvents | keyof ClientEvents;
	runOnce: boolean;
	run: Execute;
}

type Execute = (bot: Bot, ...params: any[]) => Promise<void>; // eslint-disable-line @typescript-eslint/no-explicit-any
