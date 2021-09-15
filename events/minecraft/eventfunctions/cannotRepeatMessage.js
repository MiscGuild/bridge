const index = require("../../../index.js");
const sendToDiscord = index.sendToDiscord;

module.exports = {
	name: "cannotSaySameMessageTwice",
	async execute() {
		sendToDiscord("**Error: ** `You cannot say the same message twice!`");
	}
};