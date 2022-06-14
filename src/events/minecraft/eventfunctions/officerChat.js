import { sendToDiscord } from "../../../../index.js";
import { getRankEmoji, getTagEmoji } from "../../../utilities/chatEmojiGrabber.js";
import { staffChannelID } from "../../../resources/consts.js";

export default {
	name: "officerChat",
	async execute(rank, username, tag, message) {
		tag = await getTagEmoji(tag);
		const rankData = await getRankEmoji(rank);
		rank = rankData[0];
		const color = rankData[1];

		// logger.info(`OFFICER > ${rank} ${username}: ${message}`)
		sendToDiscord(
			`${rank} **${username}** ${tag}: ${message}`,
			color,
			staffChannelID
		);
	},
};
