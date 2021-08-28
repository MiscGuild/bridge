const index = require('./../index.js');
const cron = require('node-cron');
const client = index.client;
const bot = index.bot;
const channel = client.channels.cache.get(index.channelID);
const logger = index.log4js.getLogger("Logs");

module.exports = {
    name: 'login',
    async execute(){
        logger.info('The bot has logged in!');

        setTimeout (function(){
            bot.chat('/g online');
            bot.chat('/ac \u00a7');
        },5000)

        cron.schedule('0 * * * *', () => {
            channel.send(`I will AUTO Reboot in ONE minute. I will be back in 30 seconds!`);
        });

        setInterval(function(){
            bot.chat('/chat g');
            bot.chat('/hub');
            bot.chat('/ac \u00a7');
        }, 3000000);

        setInterval(function() {
            bot.chat('/g online');
        }, 300000)

        bot.chat('/chat g');
    }
}