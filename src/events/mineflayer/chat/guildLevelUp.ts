import { Event } from "../../../interfaces/Event";
import { MessageEmbed } from "discord.js";

export default {
	name: "chat:guildLevelUp",
	runOnce: false,
	run: async (bot, guildLevel: number) => {
		const embed = new MessageEmbed()
			.setDescription(`The guild has leveled up to level **${guildLevel}**!`)
			.setColor("#00AA00");

		return await bot.sendEmbed("gc", [embed]);
	},
} as Event;
