import Discord from "discord.js";

const channelID = process.env.OUTPUTCHANNELID;
const staffChannelID = process.env.STAFFCHANNELID;
const serverID = process.env.SERVERID;
const logChannelID = process.env.LOGCHANNELID;
const blacklistChannelID = process.env.BLACKLISTCHANNELID;
const hypixelAPIKey = process.env.HypixelAPIKey;
const successColor = "0x00A86B";
const errorColor = "0xDE3163";
const errorEmbed =  new Discord.MessageEmbed()
    .setTitle("Error")
    .setColor(errorColor)
    .setDescription(
        "An unexpected error has occurred while running this command. Please contact ElijahRus#9099 or get in touch with a developer."
    );
const missingPermsEmbed = new Discord.MessageEmbed()
    .setTitle("Error")
    .setColor(errorColor)
    .setDescription(
        "It seems you are lacking the permission to run this command."
    );

export { channelID, staffChannelID, serverID, logChannelID, blacklistChannelID, hypixelAPIKey, successColor, errorColor, errorEmbed, missingPermsEmbed };
