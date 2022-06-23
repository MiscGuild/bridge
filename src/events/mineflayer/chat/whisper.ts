import { Event } from "../../../interfaces/Event";

export default {
	name: "chat:whisper",
	runOnce: false,
	run: async (bot, playerName: string, message: string) => {
		// TODO: Gexp checking?, event registration
	},
} as Event;
