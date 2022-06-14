import { Util } from 'discord.js';
import { Event } from '../../interfaces/Event';
import Emojis from '../../util/Emojis';

export default {
	name: 'chat:promotedDemoted',
	runOnce: false,
	run: async (bot, message) => {
		const messageArray: string[] = message.toString().split(',');

		const hypixelRank = messageArray[0] as string | null;
		const playerName = messageArray[1] as string;
		const changeType = messageArray[2] as 'promoted' | 'demoted';
		const guildRankFrom = messageArray[3] as string;
		const guildRankTo = messageArray[4] as string;

		await bot.sendToDiscord(
			'gc',
			`${Emojis.guildEvent} ${hypixelRank ?? ''}${Util.escapeMarkdown(
				playerName,
			)} was ${changeType} to ${guildRankTo} from ${guildRankFrom}!`,
		);
	},
} as Event;
