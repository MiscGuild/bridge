const index = require('../../../index.js');
const sendToDiscord = index.sendToDiscord;
const staffChannelID = process.env.STAFFCHANNELID;
const chatEmojis = require('../../../utilities/chatEmojis')
const getRankEmoji = chatEmojis.getRankEmoji;
const getTagEmoji = chatEmojis.getTagEmoji;

module.exports = {
  name: "officer_chat",
  async execute(rank, username, tag, message) {
    let list =  await getRankEmoji(rank);
    rank = list[0];
    let color = list[1];

    tag = await getTagEmoji(tag);

    // logger.info(`OFFICER > ${rank} ${username}: ${message}`)
    sendToDiscord(
      `${rank} **${username}** ${tag}: ${message}`,
      color,
      staffChannelID
    );
  },
};
