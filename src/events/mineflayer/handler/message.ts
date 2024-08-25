import logger from 'consola';
import { ChatMessage } from 'prismarine-chat';

export default {
    name: 'message',
    runOnce: false,
    run: (bot, message: ChatMessage) => {
        // Log color chat to console
        logger.log(message.toAnsi());
    },
} as Event;
