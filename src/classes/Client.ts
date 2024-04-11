import { Client, ClientOptions, Collection } from "discord.js";

export default class Discord extends Client {
	commands: Collection<string, Command> = new Collection();

	constructor(options: ClientOptions) {
		super(options);
	}
}
