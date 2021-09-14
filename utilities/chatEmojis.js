const index = require('../index.js');
const client = index.client;
const emojis = require('../resources/emojis.js');
let firstTime = true;
async function setEmojis(){
    emojis.forEach((emojiID, emojiName) => {
        eval('global.'+emojiName+'='+'client.emojis.cache.get("'+emojiID+'")');
    })
}

module.exports = {
    async getRankEmoji(rank) {
        if (firstTime){
            firstTime = false;
            setEmojis()
        }
        let rankChat_Emoji;
        let color;
        if(!rank){
            rankChat_Emoji = '';
            color = '0xAAAAAA';
        }
        else if(rank == '[MVP+]'){
            rankChat_Emoji = `${MVPPLUS1}${MVPPLUS2}${MVPPLUS3}${MVPPLUS4}`;
            color = '0x55FFFF';
        }
        else if(rank == '[MVP++]'){
            rankChat_Emoji = `\u200D    ${MVPPLUSPLUS1}${MVPPLUSPLUS2}${MVPPLUSPLUS3}${MVPPLUSPLUS4}`;
            color = '0xFFAA00';
        }
        else if(rank == '[VIP]'){
            rankChat_Emoji = `\u200D  ${VIP1}${VIP2}${VIP3}`;
            color = '0x55FF55';
        }
        else if(rank == '[VIP+]'){
            rankChat_Emoji = `\u200D     ${VIPPLUS1}${VIPPLUS2}${VIPPLUS3}`; 
            color = '0x55FF55';
        }
        else if(rank == '[MVP]'){
            rankChat_Emoji = `\u200D   ${MVP1}${MVP2}${MVP3}`;
            color = '0x55FFFF';
        }
        return [rankChat_Emoji, color];
    },
    async getTagEmoji(tag){
        let tag_emojis;
        if(tag == '[MISC]'){tag_emojis = `${MISC1}${MISC2}${MISC3}`}
        else if(tag == '[Active]'){tag_emojis = `${ACTIVE1}${ACTIVE2}${ACTIVE3}${ACTIVE4}`}
        else if(tag == '[Res]'){tag_emojis = `${RES1}${RES2}${RES3}`}
        else if(tag == '[GM]'){tag_emojis = `${GM1}${GM2}`}
        else if(tag == '[Admin]'){tag_emojis = `${ADMIN1}${ADMIN2}${ADMIN3}${ADMIN4}`}
        else if(tag == '[Mod]'){tag_emojis = `${MOD1}${MOD2}${MOD3}`};
        return tag_emojis;
    }
}