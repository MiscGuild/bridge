import fetch from "node-fetch";
import { hypixelAPIKey } from "../resources/consts.js";

export default async function getGuildFromPlayer(uuid) {
	return await fetch(`https://api.hypixel.net/guild?key=${hypixelAPIKey}&player=${uuid}`)
		.then(res => {
			return res.json();
		});
}
