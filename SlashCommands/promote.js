const index = require("../index.js");
const { Client, CommandInteraction, MessageEmbed } = require("discord.js");
const bot = index.bot;
const Discord = ("discord.js");

module.exports = {
    name: "promote",
    description: "Promotes a user in the guild!",
    type: 'CHAT_INPUT',
    options: [
        {
          "type": 3,
          "name": "user",
          "description": "Who would you like to promote?",
          "required": true
        },
      ],
 
    run: async (client, interaction, args) => {
        if (!interaction.member.roles.cache.some((role) => role.name === "Staff")) {
            const embed = new MessageEmbed()
            .setTitle("Error")
            .setDescription(
            "It seems you are lacking the permission to run this command."
          );
        return interaction.followUp({ embeds: [embed] })
        }
        
        bot.chat(`/g promote ${args[0]}`)
        const embed = new MessageEmbed()
        .setTitle("Promoted!")
        .setDescription(
        `I have promoted \`${args[0]}\`!`
      );
        return interaction.followUp({ embeds: [embed] })


    },
};