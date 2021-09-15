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
            setEmojis();
        }

        let rankEmojis;
        let color;

        if(!rank){
            rankEmojis = '';
            color = '0xAAAAAA';
        }
        else if(rank == '[MVP+]'){
            rankEmojis = `${MVPPLUS1}${MVPPLUS2}${MVPPLUS3}${MVPPLUS4}`;
            color = '0x55FFFF';
        }
        else if(rank == '[MVP++]'){
            rankEmojis = `\u200D    ${MVPPLUSPLUS1}${MVPPLUSPLUS2}${MVPPLUSPLUS3}${MVPPLUSPLUS4}`;
            color = '0xFFAA00';
        }
        else if(rank == '[VIP]'){
            rankEmojis = `\u200D  ${VIP1}${VIP2}${VIP3}`;
            color = '0x55FF55';
        }
        else if(rank == '[VIP+]'){
            rankEmojis = `\u200D     ${VIPPLUS1}${VIPPLUS2}${VIPPLUS3}`; 
            color = '0x55FF55';
        }
        else if(rank == '[MVP]'){
            rankEmojis = `\u200D   ${MVP1}${MVP2}${MVP3}`;
            color = '0x55FFFF';
        }
        return [rankEmojis, color];
    },

    async getTagEmoji(tag){
        let tagEmojis;
        if(tag == '[MISC]'){tagEmojis = `${MISC1}${MISC2}${MISC3}`}
        else if(tag == '[Active]'){tagEmojis = `${ACTIVE1}${ACTIVE2}${ACTIVE3}${ACTIVE4}`}
        else if(tag == '[Res]'){tagEmojis = `${RES1}${RES2}${RES3}`}
        else if(tag == '[GM]'){tagEmojis = `${GM1}${GM2}`}
        else if(tag == '[Admin]'){tagEmojis = `${ADMIN1}${ADMIN2}${ADMIN3}${ADMIN4}`}
        else if(tag == '[Mod]'){tagEmojis = `${MOD1}${MOD2}${MOD3}`};
        return tagEmojis;
    }
}