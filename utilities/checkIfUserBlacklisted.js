import fetch from "node-fetch";
import blacklist from "../resources/blacklist.js";

export default async function checkIfUserBlacklisted(user) {
	const MojangAPI = fetch(`https://api.ashcon.app/mojang/v2/user/${user}`).then(
		(res) => res.json()
	);
  
	for (const i in blacklist) {
		if (blacklist[i].uuid === MojangAPI.uuid) {
			return true;
		}
	}
	return false;
}
