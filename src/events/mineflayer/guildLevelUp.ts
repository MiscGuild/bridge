import { MessageEmbed } from "discord.js";
import { Event } from "../../interfaces/Event";
import { ChatMessage } from "prismarine-chat";

export default {
	name: "chat:guildLevelUp",
	runOnce: false,
	run: async (bot, message: ChatMessage) => {
		const messageArray = message.toString().split(",");

		const guildLevel = Number(messageArray[0]) as number;

		const embed = new MessageEmbed()
			.setDescription(`The guild has leveled up to level **${guildLevel}**!`)
			.setColor("#00AA00");

		return await bot.sendEmbed("gc", [embed]);
	},
} as Event;
