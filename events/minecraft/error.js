import { client } from "../../index.js";
import { channelID } from "../../resources/consts.js";
import log4js from "log4js";
const errorLogs = log4js.getLogger("Errors");

export default {
	name: "error",
	runOnce: false,
	execute(err) {
		console.log("Error attempting to reconnect: " + err + ".");
		errorLogs.error("Error attempting to reconnect: " + err + ".");
		client.channels.cache.get(channelID).send("ERROR: An unexpected error has occurred. Rebooting in 30s...");

		setTimeout(function() {
			console.log("Shutting down for automatic relog");
			process.exit();
		}, 30000);
	}
};