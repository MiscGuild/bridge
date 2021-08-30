const index = require("../../index.js");
const log4js =  require('log4js');
const bot = index.bot;
const staffChannelID = process.env.STAFFCHANNEL;
const McChatLogger = log4js.getLogger("McChatLogs");

module.exports = {
  name: "message",
  async execute(message) {
    if (message.channel.id == staffChannelID) {
      if (message.content.startsWith(process.env.PREFIX)) {
        return;
      }
      if (message.author.bot) {
        return;
      }
      if (message.attachments.size > 0) {
        return;
      }
      var user = message.member
      if (message.content.length > 250) {
        return message.channel.send(
          `Your message is too long! ${message.content.length}/250`
        );
      }
      bot.chat(`/oc [${user.displayName.split(" ")[0]}] -  ${message.content}`);
      McChatLogger.info(
        `DISCORD (OFFICER CHAT)> [${message.author.tag}/${message.author.id}]: ${message.content}`
      );
      message.delete();
    }
  },
};
