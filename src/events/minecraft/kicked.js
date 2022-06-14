import { client, bot } from "../../../index.js";
import { channelID } from "../../resources/consts.js";
const channel = client.channels.cache.get(channelID);

export default {
	name: "kicked",
	runOnce: false,
	execute(reason) {
		console.log(reason);
		console.log("Bot was kicked, auto relog will start in 30s");
		channel.send("ERROR: Bot was kicked. Rebooting in 30s...\n```" + reason + "```");
		bot.end();

		setTimeout(function() {
			console.log("Shutting down for automatic relog");
			process.exit();
		}, 30000);
	}
};