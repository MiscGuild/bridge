import { Event } from '../../interfaces/Event';
import { ChatMessage } from 'prismarine-chat';

export default {
	name: 'message',
	runOnce: false,
	run: async (bot, message: ChatMessage) => {
		// Log color chat to console
		bot.logger.log(message.toAnsi());
	},
} as Event;
