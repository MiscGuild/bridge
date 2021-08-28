const index = require('./../index.js');
const cron = require('node-cron');
const crypto = require('crypto');
const client = index.client;
const bot = index.bot;
const channel = client.channels.cache.get(index.channelID);
const logger = index.log4js.getLogger("Logs");

module.exports = {
    name: 'spawn',
    execute () {
        logger.info('Bot logged in!')
    
        cron.schedule('0 * * * *', () => {
        channel.send(`I will AUTO Reboot in ONE minute. I will be back in 30 seconds!`)
        });
    
        setInterval(function(){
            bot.chat('/hub')
            setTimeout (function(){
                for (var i = 0; i<15; i++) {bot.chat('/PLSSENDMETOLIMBO')}
            },5000)
            bot.chat('/chat g')
        }, 3000000);
    
        setTimeout (function(){
            bot.chat('/g online')
            for (var i = 0; i<15; i++) {bot.chat('/PLSSENDMETOLIMBO')}
        },5000)
        
        bot.chat('/chat g')
    
        setTimeout (function(){
            var randomIDQ = crypto.randomBytes(5).toString('hex');
        }, 10000)
    
        setInterval(function(){
        bot.chat('/g online') 
        }, 300000); // run g online every 5 mins
    }
}