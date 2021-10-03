import { client } from "../../../index.js";
import getPlayerCount from "../../../utilities/getPlayercount.js";

export default {
	name: "guildOnline",
	async execute(onlineMembers) {
		const hypixelPlayerCount = await getPlayerCount();
		return hypixelPlayerCount.playerCount ? 
		client.user.setPresence({ activities: [{ name: `${onlineMembers.toLocaleString()} Miscellaneous members and ${hypixelPlayerCount.playerCount.toLocaleString()} players on Hypixel!`, type:"WATCHING" }], status: "dnd" }) :
		client.user.setPresence({ activities: [{ name: `${onlineMembers.toLocaleString()} Miscellaneous members!`, type:"WATCHING" }], status: "dnd" });	 
	}
};