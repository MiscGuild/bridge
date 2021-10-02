import { sendToDiscord } from "../../../index.js";

export default {
	name: "cannotSaySameMessageTwice",
	async execute() {
		sendToDiscord("**Error: ** `You cannot say the same message twice!`");
	}
};