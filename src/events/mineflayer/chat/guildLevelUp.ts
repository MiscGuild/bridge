import { Event } from "../../../interfaces/Event";

export default {
	name: "chat:guildLevelUp",
	runOnce: false,
	run: async (bot, guildLevel: number) => {
		await bot.sendToDiscord("gc", `The guild has leveled up to level **${guildLevel}**!`, 0x00aa00, true);
	},
} as Event;
