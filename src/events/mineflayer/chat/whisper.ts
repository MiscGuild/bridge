import { Event } from "../../../interfaces/Event";

export default {
	name: "chat:whisper",
	runOnce: false,
	run: async (bot, args) => {
		args = args.toString().split(",");

		const playerName = args[0] as string;
		const message = args[1] as string;

		// TODO: Gexp checking?, commas in messages, event registration
	},
} as Event;
