const index = require("../../../index.js");
const sendToDiscord = index.sendToDiscord;

module.exports = {
	name: "commentBlocked",
	async execute(comment, reason) {
		sendToDiscord(`**Error: ** \`Your message '${comment}' was blocked for '${reason}'\``);
	}
};