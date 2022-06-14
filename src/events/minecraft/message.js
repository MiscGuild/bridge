import { client } from "../../../index.js";
import { logChannelID } from "../../resources/consts.js";
import log4js from "log4js";
const logger = log4js.getLogger("Logs");
const McChatLogger = log4js.getLogger("McChatLogs");

let logCache = [];

export default {
	name: "message",
	runOnce: false,
	async execute(message) {
		const msg = message.toString();
		logger.info(msg);
		
		if(!msg) {return;}
		else if(msg == "Unknown command. Type \"help\" for help.") {return;}
		else if(msg == "A kick occurred in your connection, so you have been routed to limbo!") {return;}
		else if(msg == "Illegal characters in chat") {return;}
		else if(msg == "You were spawned in Limbo.") {return;}
		else if(msg == "/limbo for more information.") {return;}

		McChatLogger.info(msg);
		logCache.push(msg);
		if (logCache.length >= 6) {
			client.channels.cache.get(logChannelID).send("```" + `${logCache.join("\n")}` + "```");
			logCache = [];
		}
	}
};
  