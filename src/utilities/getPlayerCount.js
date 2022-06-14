import fetch from "node-fetch";
import { hypixelAPIKey } from "../resources/consts.js";

export default async function getPlayerCount() {
	return await fetch(`https://api.hypixel.net/playercount?key=${hypixelAPIKey}`)
		.then(response => response.json())
		.catch(err =>{return console.log(err);});
}