import { sendToDiscord } from "../../../index.js";
import { getRankEmoji, getTagEmoji } from "../../../utilities/chatEmojiGrabber.js";

export default {
	name: "guildChat",
	async execute(rank, username, tag, message) {
		tag = await getTagEmoji(tag);
		const rankData = await getRankEmoji(rank);
		rank = rankData[0];
		const color = rankData[1];

		sendToDiscord(`${rank} **${username}** ${tag}: ${message}`, color);
	}
};