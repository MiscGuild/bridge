import winston from 'winston';
import { ChatMessage } from 'prismarine-chat';

export default {
    name: 'message',
    runOnce: false,
    run: (_bot, message: ChatMessage) => {
        // Log color chat to console
        winston.info(message.toAnsi());
    },
} as Event;
