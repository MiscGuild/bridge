const index = require("../../../index.js");
const sendToDiscord = index.sendToDiscord;

module.exports = {
    name: "comment_blocked",
    async execute(comment, reason){
        sendToDiscord(`**Error: ** \`Your comment, \'${comment}\' was blocked for \'${reason}\'\``);
    }
}