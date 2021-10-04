import Discord from "discord.js";

const channelID = process.env.OUTPUTCHANNELID;
const staffChannelID = process.env.STAFFCHANNELID;
const logChannelID = process.env.LOGCHANNELID;
const blacklistChannelID = process.env.BLACKLISTCHANNELID;
const serverID = process.env.SERVERID;
const prefix = process.env.PREFIX;
const hypixelAPIKey = process.env.HypixelAPIKey;
const serverIP = process.env.IP;
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

export { channelID, staffChannelID, logChannelID, blacklistChannelID, serverID, prefix, hypixelAPIKey, serverIP as IP, successColor, errorColor, errorEmbed, missingPermsEmbed };
