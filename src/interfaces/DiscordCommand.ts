import { ChatInputApplicationCommandData } from "discord.js";
import { CommandInteraction } from "discord.js";
import Bot from "../classes/Bot";

export interface Command {
	data: ChatInputApplicationCommandData;
	run: ExecuteCommand;
}

export interface ExecuteCommand {
	(bot: Bot, interaction: CommandInteraction, args: any[]): Promise<unknown>;
}
