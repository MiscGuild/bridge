const fetch = require('node-fetch');
const blacklist = require('./../blacklist.json');

module.exports = {
  async checkIfUserBlacklisted(user) {
    const MojangAPI = await fetch(
      `https://api.ashcon.app/mojang/v2/user/${user}`
    ).then((res) => res.json());
    for (var i in blacklist) {
      if (blacklist[i].uuid === MojangAPI.uuid) {
        console.log(
          blacklist[i] + "is equal to " + MojangAPI.uuid + ", returning true."
        );
        return true;
      }
    }
    return false;
  },
};
