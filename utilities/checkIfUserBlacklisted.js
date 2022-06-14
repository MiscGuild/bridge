import blacklist from "../resources/blacklist.js";
import mojangPlayerGrabber from "./mojangPlayerGrabber.js";

export default async function checkIfUserBlacklisted(username) {
	const mojangAPI = await mojangPlayerGrabber(username);
	
	for (const i of blacklist) {
		if (i.uuid === mojangAPI.id) {
			return true;
		}
	}
	return false;
}
