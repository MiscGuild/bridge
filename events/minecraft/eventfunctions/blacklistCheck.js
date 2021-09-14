const index = require("../../../index.js");
const checkIfUserBlacklisted = require("../../../utilities/checkIfUserBlacklisted.js");
const bot = index.bot;

module.exports = {
  name: "blacklist_check",
  async execute(message) {
    let guildMembers = message.split(" ●  ");
    for (let member of guildMembers) {
      if (await checkIfUserBlacklisted(member)) {
        bot.chat(
          `/g kick ${player} You have been blacklisted from the guild, Mistake? --> (discord.gg/dEsfnJkQcq)`
        );
        console.log("Kicking " + player + ", because they are blacklisted.");
      }
    }
  },
};
