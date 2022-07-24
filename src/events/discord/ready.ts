import { Event } from "../../interfaces/Event";
import { TextChannel } from "discord.js";

export default {
	name: "ready",
	runOnce: true,
	run: async (bot) => {
		bot.discord.application?.commands.set(bot.discord.commands.map((command) => command.data));

		bot.memberChannel = (await bot.discord.channels.fetch(process.env.MEMBER_CHANNEL_ID)) as TextChannel;
		bot.officerChannel = (await bot.discord.channels.fetch(process.env.OFFICER_CHANNEL_ID)) as TextChannel;

		bot.setStatus();
	},
} as Event;
