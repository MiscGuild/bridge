const index = require("../../../index.js");
const sendToDiscord = index.sendToDiscord;

module.exports = {
  name: "guildLeave",
  async execute(rank, username) {
    if (!rank) {
      rank = "";
    }
    // logger.info(`-----------------------------------------------------\n**${rank} ${username}** left the guild!\n-----------------------------------------------------`);
    sendToDiscord(
      `-----------------------------------------------------\n**${rank} ${username}** left the guild!\n-----------------------------------------------------`
    );
  },
};
