import { Bot } from 'mineflayer';
import EventEmitter from 'events';
import path from 'path';
import consola from 'consola';
import regex from '../mineflayer/events/regex';
import recursiveWalkDir from './recursive-walk-dir';
import Bridge from '../bridge';

const isObjKey = <T extends object>(key: any, obj: T): key is keyof T => key in obj;

export default async function loadEvents(dir: string, emitter: EventEmitter, bridge: Bridge) {
    const callback = async (currentDir: string, file: string) => {
        if (!(file.endsWith('.ts') || file.endsWith('.js')) || file.endsWith('.d.ts')) return;

        const { name, runOnce, run } = (await import(path.join(currentDir, file)))
            .default as BotEvent;

        if (!name) {
            consola.warn(`The event ${path.join(currentDir, file)} doesn't have a name!`);
            return;
        }

        if (!run) {
            consola.warn(`The event ${name} doesn't have an executable function!`);
            return;
        }

        if (isObjKey(name, regex)) {
            (emitter as Bot).addChatPattern(name.replace('chat:', ''), regex[name], {
                repeat: true,
                parse: true,
            });
        }

        if (runOnce) {
            emitter.once(name, run.bind(null, bridge));
            return;
        }

        emitter.on(name, (...args) => {
            run(bridge, ...args.flat(2));
        });
    };

    await recursiveWalkDir(dir, callback, 'Error while loading events:');
}
