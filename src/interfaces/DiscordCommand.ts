import { ChatInputApplicationCommandData, CommandInteraction } from "discord.js";
import Bot from "../classes/Bot";

export interface Command {
	data: ChatInputApplicationCommandData;
	run: ExecuteCommand;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExecuteCommand = (bot: Bot, interaction: CommandInteraction, args: any[]) => Promise<unknown>;
