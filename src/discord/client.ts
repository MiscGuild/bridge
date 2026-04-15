import {
    Client,
    Collection,
    ColorResolvable,
    EmbedBuilder,
    IntentsBitField,
    TextChannel,
} from 'discord.js';
import { consola } from 'consola';
import path from 'path';
import fs from 'fs';
import env from '@/config/env';
import { DEFAULT_EMBED_COLOR } from '@/config/constants';

export interface DiscordCommand {
    data: import('discord.js').ChatInputApplicationCommandData;
    run: (
        bridge: any,
        interaction: import('discord.js').ChatInputCommandInteraction,
        args: unknown[]
    ) => Promise<void>;
    staffOnly?: boolean;
}

export class DiscordClient extends Client {
    public readonly commands: Collection<string, DiscordCommand> = new Collection();
    public memberChannel?: TextChannel;
    public officerChannel?: TextChannel;

    constructor() {
        super({
            allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
            intents: [
                IntentsBitField.Flags.Guilds,
                IntentsBitField.Flags.GuildMembers,
                IntentsBitField.Flags.GuildMessages,
                IntentsBitField.Flags.MessageContent,
            ],
        });
    }

    public async send(
        channel: 'gc' | 'oc',
        content: string,
        color: ColorResolvable = DEFAULT_EMBED_COLOR,
        pad = false
    ): Promise<void> {
        const embed = new EmbedBuilder()
            .setDescription(pad ? `${'-'.repeat(54)}\n${content}\n${'-'.repeat(54)}` : content)
            .setColor(color);

        if (channel === 'gc') {
            await this.memberChannel?.send({ embeds: [embed] });
        } else {
            await this.officerChannel?.send({ embeds: [embed] });
        }
    }

    public async sendEmbed(channel: 'gc' | 'oc', embed: EmbedBuilder): Promise<void> {
        if (channel === 'gc') {
            await this.memberChannel?.send({ embeds: [embed] });
        } else {
            await this.officerChannel?.send({ embeds: [embed] });
        }
    }

    public async loadCommands(): Promise<void> {
        const dir = path.join(__dirname, 'commands');
        if (!fs.existsSync(dir)) return;

        const files = fs.readdirSync(dir).filter((f) => f.endsWith('.ts') || f.endsWith('.js'));

        for (const file of files) {
            try {
                const cmd = (await import(path.join(dir, file))).default as DiscordCommand;
                if (!cmd?.data?.name) {
                    consola.warn(`Command in ${file} missing data.name`);
                    continue;
                }
                if (!cmd.run) {
                    consola.warn(`Command ${cmd.data.name} missing run function`);
                    continue;
                }
                this.commands.set(cmd.data.name, cmd);
            } catch (err) {
                consola.error(`Failed to load command ${file}:`, err);
            }
        }

        consola.info(`Loaded ${this.commands.size} Discord commands`);
    }

    public async loadEvents(bridge: unknown): Promise<void> {
        const dir = path.join(__dirname, 'events');
        if (!fs.existsSync(dir)) return;

        const files = fs.readdirSync(dir).filter((f) => f.endsWith('.ts') || f.endsWith('.js'));

        for (const file of files) {
            try {
                const event = (await import(path.join(dir, file))).default as {
                    name: string;
                    once?: boolean;
                    run: (bridge: unknown, ...args: unknown[]) => Promise<void>;
                };

                if (event.once) {
                    this.once(event.name, (...args) => event.run(bridge, ...args));
                } else {
                    this.on(event.name, (...args) => event.run(bridge, ...args));
                }
            } catch (err) {
                consola.error(`Failed to load event ${file}:`, err);
            }
        }
    }

    public async initChannels(): Promise<void> {
        this.memberChannel = (await this.channels.fetch(env.MEMBER_CHANNEL_ID)) as TextChannel;
        this.officerChannel = (await this.channels.fetch(env.OFFICER_CHANNEL_ID)) as TextChannel;
    }
}
