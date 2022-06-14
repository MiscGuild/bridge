import { Client, ClientApplication, ClientOptions, Collection } from "discord.js";
import { Command } from "../interfaces/DiscordCommand";

ClientApplication;

export default class Discord extends Client {
	commands: Collection<string, Command> = new Collection();

	constructor(options: ClientOptions) {
		super(options);
	}
}
