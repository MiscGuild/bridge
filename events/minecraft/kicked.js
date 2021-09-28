const index = require("../../index.js");
const client = index.client;
const bot = index.bot;
const channel = client.channels.cache.get(process.env.OUTPUTCHANNELID);

module.exports = {
	name: "kicked",
	runOnce: false,
	execute(reason) {
		console.log(reason);
		console.log("I was kicked, auto relog will start in 60s");
		// channel.send("**BOT WAS KICKED, IT WILL REBOOT IN 60s**\n```" + reason + "```");
		// bot.end();

		// setTimeout(function() {
		// 	console.log("Shutting down for automatic relog");
		// 	channel.send("**SHUTTING DOWN FOR RELOG**");
		// 	process.exit();
		// }, 60000);
	}
};