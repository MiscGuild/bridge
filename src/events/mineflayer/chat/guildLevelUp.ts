import { Event } from "../../../interfaces/Event";

export default {
	name: "chat:guildLevelUp",
	runOnce: false,
	run: async (bot, guildLevel: number) => {
		return await bot.sendToDiscord("gc", `The guild has leveled up to level **${guildLevel}**!`, 0x00AA00);
	},
} as Event;
