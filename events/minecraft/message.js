const index = require("../../index.js");
const log4js = require("log4js");
const client = index.client;
const logger = log4js.getLogger("Logs");
const McChatLogger = log4js.getLogger("McChatLogs");

let discordChatLogs = [];
setInterval(() => {
	if(!discordChatLogs.length) {return;}
	client.channels.cache.get(process.env.LOGCHANNELID).send("```" + `${discordChatLogs.join("\n")}` + "```");
	discordChatLogs = [];
}, 1000);

module.exports = {
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

		discordChatLogs.push(msg);
		McChatLogger.info(msg);
	}
};
  
