import { ChatInputApplicationCommandData, CommandInteraction } from "discord.js";
import Bot from "../classes/Bot";

export interface Command {
	data: ChatInputApplicationCommandData;
	run: ExecuteCommand;
}

type ExecuteCommand = (bot: Bot, interaction: CommandInteraction, args: any[]) => Promise<unknown>;
