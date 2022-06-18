import { MessageEmbed } from "discord.js";
import { Event } from "../../interfaces/Event";
import Emojis from "../../util/emojis";

export default {
	name: "chat:questComplete",
	runOnce: false,
	run: async (bot) => {
		const embed = new MessageEmbed()
			.setDescription(`${Emojis.guildEvent} The guild has completed this week's Guild Quest!`)
			.setColor("#FFAA00");

		return await bot.sendEmbed("gc", [embed]);
	},
} as Event;
