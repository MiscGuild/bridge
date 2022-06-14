import { TextChannel } from 'discord.js';
import Bot from '../../classes/Bot';
import { Event } from '../../interfaces/Event';

export default {
	name: 'ready',
	runOnce: true,
	run: async (bot: Bot) => {
		bot.discord.application?.commands.set(
			bot.discord.commands.map((v) => v.data),
			process.env.SERVER_ID as string,
		);

		bot.memberChannel = (await bot.discord.channels.fetch(process.env.MEMBER_CHANNEL_ID as string)) as TextChannel;
		bot.officerChannel = (await bot.discord.channels.fetch(
			process.env.OFFICER_CHANNEL_ID as string,
		)) as TextChannel;

		await bot.setStatus();
	},
} as Event;
