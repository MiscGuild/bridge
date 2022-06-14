import { MessageEmbed } from 'discord.js';
import { Event } from '../../interfaces/Event';

export default {
	name: 'chat:guildLevelUp',
	runOnce: false,
	run: async (bot, message) => {
		const messageArray: string[] = message.toString().split(',');

		const guildLevel = Number(messageArray[0]) as number;

		const embed = new MessageEmbed()
			.setDescription(`The guild has leveled up to level **${guildLevel}**!`)
			.setColor('#00AA00');

		return await bot.sendEmbed('gc', [embed]);
	},
} as Event;
