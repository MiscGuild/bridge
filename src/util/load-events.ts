import path from 'path';
import winston from 'winston';
import regex from '@mineflayer/events/regex';
import recursiveWalkDir from '@util/recursive-walk-dir';
import Bridge from '../bridge';

const isObjKey = <T extends object>(key: any, obj: T): key is keyof T => key in obj;

type EventHandler = (...args: any[]) => void;

interface EmitterLike {
    on(event: string, listener: EventHandler): void;
    once(event: string, listener: EventHandler): void;
}

interface ChatPatternEmitter extends EmitterLike {
    addChatPattern(name: string, pattern: RegExp, options: { repeat: boolean; parse: boolean }): void;
}

const hasChatPatternEmitter = (emitter: EmitterLike): emitter is ChatPatternEmitter =>
    typeof (emitter as Partial<ChatPatternEmitter>).addChatPattern === 'function';

export default async function loadEvents(dir: string, emitter: EmitterLike, bridge: Bridge) {
    const callback = async (currentDir: string, file: string) => {
        if (!(file.endsWith('.ts') || file.endsWith('.js')) || file.endsWith('.d.ts')) return;

        const { name, runOnce, run } = (await import(path.join(currentDir, file)))
            .default as BotEvent;

        if (!name) {
            winston.warn(`The event ${path.join(currentDir, file)} doesn't have a name!`);
            return;
        }

        if (!run) {
            winston.warn(`The event ${name} doesn't have an executable function!`);
            return;
        }

        if (isObjKey(name, regex) && hasChatPatternEmitter(emitter)) {
            emitter.addChatPattern(name.replace('chat:', ''), regex[name], {
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
