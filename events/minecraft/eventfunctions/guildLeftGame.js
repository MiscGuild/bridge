import { sendToDiscord } from "../../../index.js";

export default {
	name: "guildLeftGame",
	async execute(username) {
		// logger.info(`${username} left the game.`);
		sendToDiscord(`**${username}** left the game.`);
	}
};