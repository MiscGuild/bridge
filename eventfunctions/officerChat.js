const index = require('./../index.js');
const staffChannelID = process.env.STAFFCHANNEL;
const getEmojiColor = require('../utilities/chatEmojis').getRankEmoji;

module.exports = {
  name: "officer_chat",
  async execute(rank_officer_chat, username_officer_chat, officer_chat_tag, message_officer_chat) {
    let list =  await getEmojiColor(rank_officer_chat);
    let rank_officer_chat_emoji = list[0];
    let color = list[1];


    // logger.info(`OFFICER > ${rank_guild_chat} ${username_guild_chat}: ${message_guild_chat}`)
    index.sendToDiscord(
      `${rank_officer_chat_emoji} **${username_officer_chat}** ${officer_chat_tag}: ${message_officer_chat}`,
      color,
      staffChannelID
    );
  },
};
