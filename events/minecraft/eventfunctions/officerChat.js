const index = require('../../../index.js');
const sendToDiscord = index.sendToDiscord;
const staffChannelID = process.env.STAFFCHANNELID;
const chatEmojis = require('../../../utilities/chatEmojis')
const getRankEmoji = chatEmojis.getRankEmoji;
const getTagEmoji = chatEmojis.getTagEmoji;

module.exports = {
  name: "officer_chat",
  async execute(rank_officer_chat, username_officer_chat, officer_chat_tag, message_officer_chat) {
    let list =  await getRankEmoji(rank_officer_chat);
    rank_officer_chat = list[0];
    let color = list[1];

    officer_chat_tag = await getTagEmoji(officer_chat_tag);

    // logger.info(`OFFICER > ${rank_guild_chat} ${username_guild_chat}: ${message_guild_chat}`)
    sendToDiscord(
      `${rank_officer_chat} **${username_officer_chat}** ${officer_chat_tag}: ${message_officer_chat}`,
      color,
      staffChannelID
    );
  },
};
