const index = require("./../index.js");
const sendToDiscord = index.sendToDiscord;

module.exports = {
  name: "guild_leave",
  async execute(Rank_guild_leave, username_guild_leave) {
    if (!Rank_guild_leave) {
      var Rank_guild_leave = "";
    }
    // logger.info(`-----------------------------------------------------\n**${Rank_guild_leave} ${username_guild_leave}** left the guild!\n-----------------------------------------------------`);
    sendToDiscord(
      `-----------------------------------------------------\n**${Rank_guild_leave} ${username_guild_leave}** left the guild!\n-----------------------------------------------------`
    );
  },
};
