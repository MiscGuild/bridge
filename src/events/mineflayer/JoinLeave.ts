import { Util } from 'discord.js';
import { Event } from '../../interfaces/Event';
import Emojis from '../../util/Emojis';

export default {
	name: 'chat:joinLeave',
	runOnce: false,
	run: async (bot, message) => {
		const messageArray: string[] = message.toString().split(',');

		const playerName = messageArray[0] as string;
		const status = messageArray[1] as 'joined' | 'left';

		if (status === 'joined') {
			bot.onlineCount++;
			await bot.sendToDiscord(
				'gc',
				`${Emojis.join} ${Util.escapeMarkdown(playerName)} joined. (\`${bot.onlineCount}\`/\`${
					bot.totalCount
				}\`)`,
			);
		}

		if (status === 'left') {
			bot.onlineCount--;
			await bot.sendToDiscord(
				'gc',
				`${Emojis.leave} ${Util.escapeMarkdown(playerName)} left. (\`${bot.onlineCount}\`/\`${
					bot.totalCount
				}\`)`,
			);
		}
	},
} as Event;
