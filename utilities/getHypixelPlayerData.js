import fetch from "node-fetch";
import { hypixelAPIKey } from "../resources/consts.js";

export default async function getHypixelPlayerData(uuid, username) {
	return await fetch(`https://api.hypixel.net/player?key=${hypixelAPIKey}&uuid=${uuid}&player=${username}`
	).then((res) => {
		return res.json();
	});
}