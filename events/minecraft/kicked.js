const index = require('../../index.js');
const client = index.client;
const bot = index.bot;
const channel = client.channels.cache.get(index.channelID);

module.exports = {
    name: 'kicked',
    execute(reason) {
        console.log(reason)
        console.log('I was kicked, auto relog will start in ~75s')
        channel.send('**BOT WAS KICKED, IT WILL REBOOT IN 75s**\n```'+ reason + '```')
        bot.end();
        setTimeout(function(){ 
            console.log('Shutting down for automatic relog')    
            channel.send('**SHUTTING DOWN FOR RELOG**')  
            process.exit()
        }, 75000);
    }
}