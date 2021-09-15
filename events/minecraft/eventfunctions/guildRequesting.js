const index = require("../../../index.js");
const bot = index.bot;
const fetch = require("node-fetch");
const checkIfUserBlacklisted = require("../../../utilities/checkIfUserBlacklisted.js");
const getNetworkLevel = require("../../../utilities/getNetworkLevel.js");
const mojangGrabber = require("../../../utilities/mojangGrabber.js");

module.exports = {
  name: "guildRequesting",
  async execute(rank, username) {
    if (!rank) {
      rank = "";
    }
    // logger.info(`-----------------------------------------------------\n**${rank} ${username}** is requesting to join the guild! \nA staff member can do \`)command g accept ${username}\`\n-----------------------------------------------------`)

    if (await checkIfUserBlacklisted(username)) {
      bot.chat(
        `/oc The player ${username} is blacklisted. Do NOT accept their request.`
      );
    } else {
      let mojangAPI = mojangGrabber(username);
      const HyAPI = await fetch(
        `https://api.hypixel.net/player?key=${process.env.HypixelAPIKey}&uuid=${mojangAPI.id}&player=${username}`
      ).then((res) => res.json());

      if ((await getNetworkLevel(HyAPI.player.networkExp)) >= 50) {
        console.log(`Accepting the player ${username}`);
        bot.chat(`/g accept ${username}`);
      } else {
        bot.chat(`/oc The player ${username} is not network level 50!`);
      }
    }
  },
};
