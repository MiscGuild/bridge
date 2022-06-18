import Emojis from "../../util/emojis";
import { Event } from "../../interfaces/Event";
import { MessageEmbed } from "discord.js";

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
