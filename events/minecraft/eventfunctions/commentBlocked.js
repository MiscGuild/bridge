import { sendToDiscord } from "../../../index.js";

export default {
	name: "commentBlocked",
	async execute(comment, reason) {
		sendToDiscord(`**Error: ** \`Your message '${comment}' was blocked for '${reason}'\``);
	}
};