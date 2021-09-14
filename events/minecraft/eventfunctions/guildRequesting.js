const index = require("../../../index.js");
const bot = index.bot;
const fetch = require("node-fetch");
const checkIfUserBlacklisted = require("../../../utilities/checkIfUserBlacklisted.js");
const getNetworkLevel = require("../../../utilities/getNetworkLevel.js");

module.exports = {
  name: "guild_requesting",
  async execute(guild_requesting_rank, guild_requesting_username) {
    if (!guild_requesting_rank) {
      guild_requesting_rank = "";
    }
    // logger.info(`-----------------------------------------------------\n**${guild_requesting_rank} ${guild_requesting_username}** is requesting to join the guild! \nA staff member can do \`)command g accept ${guild_requesting_username}\`\n-----------------------------------------------------`)

    if (await checkIfUserBlacklisted(guild_requesting_username)) {
      bot.chat(
        `/oc The player ${guild_requesting_username} is blacklisted. Do NOT accept their request.`
      );
    } else {
      const HyAPI = await fetch(
        `https://api.hypixel.net/player?key=${process.env.HypixelAPIKey}&uuid=${guild_requesting_uuid}&player=${guild_requesting_username}`
      ).then((response) => response.json());
      
      if ((await getNetworkLevel(HyAPI.player.networkExp)) >= 50) {
        console.log(`Accepting the player ${guild_requesting_username}`);
        bot.chat(`/g accept ${guild_requesting_username}`);
      } else {
        bot.chat(
          `/oc The player ${guild_requesting_username} is not network level 50!`
        );
      }
    }
  },
};
