const index = require("../../index.js");
const log4js =  require('log4js');
const bot = index.bot;
const channelID = process.env.OUTPUTCHANNELID;
const McChatLogger = log4js.getLogger("McChatLogs");

module.exports = {
  name: "message",
  async execute(message) {
    if (message.channel.id == channelID) {
      if (message.content.startsWith(process.env.PREFIX)) {
        return;
      }
      if (message.author.bot) {
        return;
      }
      if (message.attachments.size > 0) {
        return;
      }
      let user = message.member
      if (message.content.length > 100) {
        return message.channel.send(
          `Your message is too long! ${message.content.length}/100`
        );
      }
      bot.chat(`/gc [${user.displayName.split(" ")[0]}] - ${message.content}`);
      McChatLogger.info(
        `DISCORD > [${message.author.tag}/${message.author.id}]: ${message.content}`
      );
      message.delete();
    }
  },
};
