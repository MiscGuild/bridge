const { Client, CommandInteraction, MessageEmbed } = require("discord.js");

module.exports = {
    name: "ping",
    description: "Returns websocket ping",
    type: 'CHAT_INPUT',
 
    run: async (client, interaction, args) => {
        const embed = new MessageEmbed()
            .setTitle('Pinging...')
        interaction.followUp({ embeds: [embed] }).then(msg => {
            const ping = msg.createdTimestamp - interaction.createdTimestamp;
            const embed2 = new MessageEmbed()
            .setTitle(`Your ping is ${ping} ms`)
            msg.edit({embeds:[embed2]})
        })

    },
};