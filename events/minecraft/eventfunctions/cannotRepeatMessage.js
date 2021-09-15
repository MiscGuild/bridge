const index = require("../../../index.js");
const sendToDiscord = index.sendToDiscord;

module.exports = {
    name: "cannot_say_same_msg_twice",
    async execute(){
        sendToDiscord("**Error: ** `You cannot say the same message twice!`");
    }
}