const fetch = require("node-fetch");
const blacklist = require("../resources/blacklist.json");

module.exports = async function checkIfUserBlacklisted(user) {
  const MojangAPI = fetch(`https://api.ashcon.app/mojang/v2/user/${user}`).then(
    (res) => res.json()
  );
  
  for (var i in blacklist) {
    if (blacklist[i].uuid === MojangAPI.uuid) {
      return true;
    }
  }
  return false;
};
