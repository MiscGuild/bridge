import { sendToDiscord } from "../../../index.js";
import { getRankEmoji, getTagEmoji } from "../../../utilities/chatEmojis.js";

export default {
	name: "guildChat",
	async execute(rank, username, tag, message) {
		tag = await getTagEmoji(tag);
		rank = await getRankEmoji(rank);
		const color = rank[1];
		rank = rank[0];
        
		sendToDiscord(`${rank} **${username}** ${tag}: ${message}`, color);
	}
};