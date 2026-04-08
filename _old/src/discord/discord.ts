import { Client, Collection, ColorResolvable, EmbedBuilder, TextChannel } from 'discord.js';
import recursiveWalkDir from '../util/recursive-walk-dir';
import consola from 'consola';
import path from 'path';
import loadEvents from '../util/load-events';
import Bridge from '../bridge';

export default class Discord extends Client {
    public readonly commands: Collection<string, Command> = new Collection();
    public memberChannel?: TextChannel;
    public officerChannel?: TextChannel;

    public async send(
        channel: 'gc' | 'oc',
        content: string,
        color: ColorResolvable = 0x36393f,
        pad = false
    ) {
        const embed = new EmbedBuilder()
            .setDescription(pad ? `${'-'.repeat(54)}\n${content}\n${'-'.repeat(54)}` : content)
            .setColor(color);

        if (channel === 'gc') {
            await this.memberChannel?.send({ embeds: [embed] });
        } else {
            await this.officerChannel?.send({ embeds: [embed] });
        }
    }

    public async loadCommands() {
        const callback = async (currentDir: string, file: string) => {
            if (!(file.endsWith('.ts') || file.endsWith('.js')) || file.endsWith('.d.ts')) return;

            const command = (await import(path.join(currentDir, file))).default as Command;

            if (!command.data) {
                consola.warn(`The command ${path.join(currentDir, file)} doesn't have a name!`);
                return;
            }

            if (!command.run) {
                consola.warn(
                    `The command ${command.data.name} doesn't have an executable function!`
                );
                return;
            }

            this.commands.set(command.data.name, command);
        };

        await recursiveWalkDir(
            path.join(__dirname, 'commands/'),
            callback,
            'Error while loading commands:'
        );
    }

    public async loadEvents(bridge: Bridge) {
        await loadEvents(path.join(__dirname, 'events/'), this, bridge);
    }
}
