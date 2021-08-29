const index = require("./../index.js");
const blacklist = require("./../blacklist.json");
const getNetworkLevel = require("./../utilities/getNetworkLevel");
const fetch = require("node-fetch");
const bot = index.bot;

module.exports = {
  name: "guild_requesting",
  async execute(guild_requesting_rank, guild_requesting_username) {
    if (!guild_requesting_rank) {
      var guild_requesting_rank = "";
    }
    // logger.info(`-----------------------------------------------------\n**${guild_requesting_rank} ${guild_requesting_username}** is requesting to join the guild! \nA staff member can do \`)command g accept ${guild_requesting_username}\`\n-----------------------------------------------------`)

    const MojangAPI = await fetch(
      `https://api.ashcon.app/mojang/v2/user/${guild_requesting_username}`
    ).then((res) => res.json());
    for (var i in blacklist) {
      var guild_requesting_uuid = MojangAPI.uuid;
      if (blacklist[i].uuid == guild_requesting_uuid) {
        return bot.chat(
          `/oc The player ${guild_requesting_username} is on the blacklist! Do **NOT** accept their request.`
        );
      }
    }

    const HyAPI = await fetch(
      `https://api.hypixel.net/player?key=${process.env.HypixelAPIKey}&uuid=${guild_requesting_uuid}&player=${guild_requesting_username}`
    ).then((response) => response.json());
    if ((await getNetworkLevel(HyAPI.player.networkExp)) >= 50) {
      console.log("accepeting player");
      bot.chat(`/g accept ${guild_requesting_username}`);
    } else {
      bot.chat(
        `/oc The player ${guild_requesting_username} is not network level 50!`
      );
    }
  },
};
