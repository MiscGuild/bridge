const index = require("../../../index.js");
const sendToDiscord = index.sendToDiscord;

module.exports = {
  name: "guild_leave",
  async execute(rank, username) {
    if (!rank) {
      rank = "";
    }
    // logger.info(`-----------------------------------------------------\n**${Rank_guild_leave} ${username_guild_leave}** left the guild!\n-----------------------------------------------------`);
    sendToDiscord(
      `-----------------------------------------------------\n**${rank} ${username}** left the guild!\n-----------------------------------------------------`
    );
  },
};
