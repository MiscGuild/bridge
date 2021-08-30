const index = require('./../index.js');
const sendToDiscord = index.sendToDiscord;
const chatEmojis = require('../utilities/chatEmojis.js');
const getRankEmoji = chatEmojis.getRankEmoji;
const getTagEmoji = chatEmojis.getTagEmoji;

module.exports = {
    name: 'guild_chat',
    async execute(rank_guild_chat, username_guild_chat, tag_guild_chat, message_guild_chat){
        let rankList =  await getRankEmoji(rank_guild_chat);
        let rankChat_Emoji = rankList[0];
        let color = rankList[1];

        let tag_chat_emojis = await getTagEmoji(tag_guild_chat);
        
        sendToDiscord(`${rankChat_Emoji} **${username_guild_chat}** ${tag_chat_emojis}: ${message_guild_chat}`, color);
    }
}