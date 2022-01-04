import fetch from "node-fetch";
import { hypixelAPIKey } from "../resources/consts.js";

export default async function getHypixelPlayerData(uuid) {
	return await fetch(`https://api.hypixel.net/player?key=${hypixelAPIKey}&uuid=${uuid}`
	).then((res) => {
		return res.json();
	});
}
