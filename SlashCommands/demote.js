const index = require("../index.js");
const { Client, CommandInteraction, MessageEmbed } = require("discord.js");
const bot = index.bot;
const Discord = ("discord.js");

module.exports = {
    name: "demote",
    description: "Demotes a user in the guild!",
    type: 'CHAT_INPUT',
    options: [
        {
          "type": 3,
          "name": "user",
          "description": "Who would you like to demote?",
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
        
        bot.chat(`/g demote ${args[0]}`)
        const embed = new MessageEmbed()
        .setTitle("Demoted!")
        .setDescription(
        `I have demoted \`${args[0]}\`!`
      );
        return interaction.followUp({ embeds: [embed] })


    },
};