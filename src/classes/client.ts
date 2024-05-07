import { Client, Collection } from 'discord.js';

export default class Discord extends Client {
    public readonly commands: Collection<string, Command> = new Collection();
}
