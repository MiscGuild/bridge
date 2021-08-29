const index = require("./../index.js");
const checkIfUserBlacklisted = require("./../utilities/checkIfUserBlacklisted.js").checkIfUserBlacklisted;
const bot = index.bot;

module.exports = {
  name: "blacklist_check",
  async execute(blacklist_check_content) {
    var guildMembers = blacklist_check_content.split(" ●  ");
    guildMembers.forEach(function (player, index) {
      if (checkIfUserBlacklisted(player)) {
        //bot.chat(`/g kick ${player} You have been blacklisted from the guild, Mistake? --> (discord.gg/dEsfnJkQcq)`)
        console.log("Not kicking " + player + ", blacklisted is returning true.");
      }
    });
  },
};
