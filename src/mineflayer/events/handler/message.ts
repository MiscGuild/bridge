import winston from 'winston';
import { ChatMessage } from 'prismarine-chat';

export default {
    name: 'message',
    runOnce: false,
    run: (_bridge, message: ChatMessage) => {
        winston.info(message.toAnsi());
    },
} as BotEvent;
