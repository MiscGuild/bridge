const index = require('../../index.js');
const log4js =  require('log4js');
const client = index.client;
const channelID = process.env.OUTPUTCHANNEL;
const errorLogs = log4js.getLogger("Errors");

module.exports = { 
    name: 'error',
    runOnce: false,
    execute(err) {
        console.log('Error attempting to reconnect: ' + err + '.');
        errorLogs.error('Error attempting to reconnect: ' + err + '.')
        client.channels.cache.get(channelID).send('**BOT WAS KICKED, IT WILL REBOOT IN 75s**')
        setTimeout(function(){ 
            console.log('Shutting down for automatic relog')    
            channel.send('**SHUTTING DOWN FOR RELOG**')  
            process.exit()
        }, 75000);
    }
}