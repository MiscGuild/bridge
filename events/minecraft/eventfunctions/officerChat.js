import { sendToDiscord } from "../../../index.js";
import { getRankEmoji, getTagEmoji } from "../../../utilities/chatEmojis.js";
const staffChannelID = process.env.STAFFCHANNELID;

export default {
	name: "officerChat",
	async execute(rank, username, tag, message) {
		tag = await getTagEmoji(tag);
		rank = await getRankEmoji(rank);
		const color = rank[1];
		rank = rank[0];

		// logger.info(`OFFICER > ${rank} ${username}: ${message}`)
		sendToDiscord(
			`${rank} **${username}** ${tag}: ${message}`,
			color,
			staffChannelID
		);
	},
};
