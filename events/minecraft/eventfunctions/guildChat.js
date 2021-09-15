const index = require("../../../index.js");
const sendToDiscord = index.sendToDiscord;
const chatEmojis = require("../../../utilities/chatEmojis.js");
const getRankEmoji = chatEmojis.getRankEmoji;
const getTagEmoji = chatEmojis.getTagEmoji;

module.exports = {
	name: "guildChat",
	async execute(rank, username, tag, message) {
		const rankList = await getRankEmoji(rank);
		rank = rankList[0];
		const color = rankList[1];

		tag = await getTagEmoji(tag);
        
		sendToDiscord(`${rank} **${username}** ${tag}: ${message}`, color);
	}
};