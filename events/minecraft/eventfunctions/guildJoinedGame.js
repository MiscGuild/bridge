import { sendToDiscord } from "../../../index.js";

export default {
	name: "guildJoinedGame",
	async execute(username) {
		sendToDiscord(`Welcome back, **${username}**!`);
	}
};