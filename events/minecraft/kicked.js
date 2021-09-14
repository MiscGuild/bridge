const index = require('../../index.js');
const client = index.client;
const bot = index.bot;
const channelID = process.env.OUTPUTCHANNEL;

module.exports = {
    name: 'kicked',
    runOnce: false,
    execute(reason) {
        console.log(reason)
        console.log('I was kicked, auto relog will start in ~75s')
        client.channels.cache.get(channelID).send('**BOT WAS KICKED, IT WILL REBOOT IN 75s**\n```'+ reason + '```')
        bot.end();
        setTimeout(function(){ 
            console.log('Shutting down for automatic relog')    
            channel.send('**SHUTTING DOWN FOR RELOG**')  
            process.exit()
        }, 75000);
    }
}