import consola from 'consola';
import { ChatMessage } from 'prismarine-chat';

export default {
    name: 'message',
    runOnce: false,
    run: (_bridge, message: ChatMessage) => {
        consola.info(message.toAnsi());
    },
} as BotEvent;
