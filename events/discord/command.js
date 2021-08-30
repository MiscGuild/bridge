const index = require("../../index.js");
const blacklist = require("../../resources/blacklist.json");
const log4js = require("log4js");
const Discord = require("discord.js");
const fetch = require('node-fetch');
const bot = index.bot;
const client = index.client;
const channelID = process.env.OUTPUTCHANNEL;

const logger = log4js.getLogger("logs");
const errorLogs = log4js.getLogger("Errors");

module.exports = {
  name: "message",
  async execute(message) {
    let channel = client.channels.cache.get(channelID);
    if (!message.content.startsWith(process.env.PREFIX) || message.author.bot)
      return;

    const args = message.content
      .slice(process.env.PREFIX.length)
      .trim()
      .split(" ");
    const command = args.shift().toLowerCase();

    if (command === "help".toLowerCase()) {
      if (message.member.roles.cache.some((role) => role.name === "Staff")) {
        return message.channel.send({
          embed: {
            color: 0x2f3136,
            title: "Commands",
            fields: [
              {
                name: "help",
                value: "Prints this message",
                inline: false,
              },
              {
                name: "reboot",
                value: "Restarts the bot",
                inline: false,
              },
              {
                name: "chat",
                value: "Any chat message ingame",
                inline: false,
              },
              {
                name: "command",
                value: "Run a command",
                inline: false,
              },
              {
                name: "blacklist",
                value: "Add, list, or remove people on the blacklist",
                inline: false,
              },
            ],
            footer: {
              text: `You can send messages ingame by typing in #bridge`,
            },
          },
        });
      } else {
        return message.channel.send({
          embed: {
            color: 0x2f3136,
            title: "Commands",
            fields: [
              {
                name: "help",
                value: "Prints this message",
                inline: false,
              },
            ],
            footer: {
              text: `You can send messages ingame by typing in #bridge`,
            },
          },
        });
      }
    } else if (command === "chat".toLowerCase()) {
      if (message.member.roles.cache.some((role) => role.name === "Staff")) {
        var user = message.guild.member(message.member);

        if (!args.length) {
          return message.channel.send({
            embed: {
              color: 0x2f3136,
              title: "Error",
              description: `You need to provide a message for me to send!`,
            },
          });
        }
        return bot.chat(`[${user.displayName}]: ${args.join(" ").toString()}`);
      } else {
        return message.channel.send({
          embed: {
            color: 0x2f3136,
            title: "Error",
            description: `It seems you are lacking the permission to run this command.`,
          },
        });
      }
    } else if (command === "command".toLowerCase()) {
      try {
        if (message.member.roles.cache.some((role) => role.name === "Staff")) {
          var user = message.guild.member(message.member);

          if (!args.length) {
            return message.channel.send({
              embed: {
                color: 0x2f3136,
                title: "Error",
                description: `You need to provide a message for me to send!`,
              },
            });
          }
          if (args[1] == "kick".toLowerCase()) {
            return (
              bot.chat(
                `/${args.join(" ").toString()} [Kicker: ${user.displayName}]`
              ),
              message.react("✅")
            );
          }
          if (args[0] == "oc".toLowerCase()) {
            if (!args[1]) {
              return message.channel.send({
                embed: {
                  color: 0x2f3136,
                  title: "Error",
                  description: `You need to provide a message for me to send!`,
                },
              });
            }
            return (
              bot.chat(
                `/oc [${user.displayName}] ${args
                  .join(" ")
                  .toString()
                  .replace("oc", "")}`
              ),
              message.react("✅")
            );
          }

          return bot.chat(`/${args.join(" ").toString()}`), message.react("✅");
        } else {
          return message.channel.send({
            embed: {
              color: 0x2f3136,
              title: "Error",
              description: `It seems you are lacking the permission to run this command.`,
            },
          });
        }
      } catch (err) {
        errorLogs.error(err);
        message.channel.send({
          embed: {
            color: 0x2f3136,
            title: "Error",
            description: `An unknown error has occurred! Please contact @elijahsus to fix it!`,
          },
        });
      }
    } else if (command === "reboot".toLowerCase()) {
      if (
        message.member.roles.cache.some((role) => role.name === "Staff") ||
        message.author.id === "308343641598984203"
      ) {
        var user = message.guild.member(message.member);

        message.channel.send({
          embed: {
            color: 0x2f3136,
            title: "Rebooting",
            description: `The bot will restart in \`45s\``,
          },
        }),
          logger.info(
            `Bot will reboot in 45s due to ${user.displayName} running the reboot command`
          );
        var randomID = crypto.randomBytes(7).toString("hex");
        channel.send(
          `Bot will reboot in 45s due to ${user.displayName} running the reboot command`
        );
        setTimeout(() => {
          message.channel.send({
            embed: {
              color: 0x2f3136,
              title: "Rebooting",
              description: `The bot is now restarting`,
            },
          });
          message.channel.send();
          process.exit();
        }, 45000);
      } else {
        return message.channel.send({
          embed: {
            color: 0x2f3136,
            title: "Error",
            description: `It seems you are lacking the permission to run this command.`,
          },
        });
      }
    } else if (command === "blacklist".toLowerCase()) {
      if (message.member.roles.cache.some((role) => role.name === "Staff")) {
        if (!args[0]) {
          const embed = new Discord.MessageEmbed()
            .setTitle("Blacklist")
            .setColor(0x2f3136)
            .setDescription(
              `The list below shows everyone who is on the blacklist (Total: ${blacklist.length})`
            )
            .setFooter(
              "The name is based on the name that was givin at the time of blacklist, refer to the UUID if the user has changed their name."
            );

          blacklist.forEach((element) =>
            embed.addField(
              `${element.user}`,
              `**End:** ${element.end}\n**Reason:** ${element.reason}\n**UUID:** ${element.uuid}\n[Message Link](https://discord.com/channels/522586672148381726/709370599809613824/${element.msgID})`
            )
          );

          if (embed.length >= 2000) {
            const embed2 = new Discord.MessageEmbed()
              .setColor(0x2f3136)
              .setTitle("Error | Too many people on blacklist")
              .setDescription(
                "Discord has a character limit and we have reached it with the message trying to be sent. Look at the blacklist list in <#709370599809613824>"
              );
            return message.channel.send(embed2);
          }
          message.channel.send({ embed });
        }
        if (args[0]) {
          if (args[0] == "add".toLowerCase()) {
            if (!args[1]) {
              return message.channel.send({
                embed: {
                  color: 0x2f3136,
                  title: "Error | Invalid Arguments",
                  description:
                    "```" +
                    process.env.PREFIX +
                    "blacklist <add/remove> <user>\n                        ^^^^^^\nYou must specify a user to add to the blacklist```",
                },
              });
            }

            async function blacklistadd() {
              if (!args[2]) {
                return message.channel.send({
                  embed: {
                    color: 0x2f3136,
                    title: "Error | Invalid Arguments",
                    description:
                      "```" +
                      process.env.PREFIX +
                      "blacklist add <user> <end> <reason>\n                      ^^^^^\nYou must specify an end date (It can be never)```",
                  },
                });
              }

              if (!args[3]) {
                return message.channel.send({
                  embed: {
                    color: 0x2f3136,
                    title: "Error | Invalid Arguments",
                    description:
                      "```" +
                      process.env.PREFIX +
                      "blacklist add <user> <end> <reason>\n                               ^^^^^\nYou must specify a reason for the blacklist```",
                  },
                });
              }

              const MojangAPI = await fetch(
                `https://api.ashcon.app/mojang/v2/user/${args[1]}`
              ).then((res) => res.json());
              if (!MojangAPI.uuid) {
                return message.channel.send({
                  embed: {
                    color: 0x2f3136,
                    title: "Error",
                    description: `I have encountered an error while attempting your request, a detailed log is below.\n\`\`\`Error: ${MojangAPI.code}, ${MojangAPI.error}\nReason: ${MojangAPI.reason}\`\`\``,
                  },
                });
              }

              for (const i in blacklist) {
                if (blacklist[i].uuid == MojangAPI.uuid) {
                  return message.channel.send({
                    embed: {
                      color: 0x2f3136,
                      title: "Error",
                      description: `That user appears to already be on the blacklist. To check who is on the blacklist please run the \`${process.env.PREFIX}blacklist\` command`,
                    },
                  });
                }
              }

              function addUserToBlacklist(user, uuid, end, reason) {
                return new Promise((resolve, reject) => {
                  const embed = new Discord.MessageEmbed()
                    .setTitle(user)
                    .setAuthor(
                      "Blacklist",
                      "https://media.discordapp.net/attachments/522930879413092388/849317688517853294/misc.png"
                    ) /*           * Alternatively, use "#00AE86", [0, 174, 134] or an integer number.           */
                    .setColor("ff0000")
                    .setFooter(`UUID: ${uuid}`)
                    .setThumbnail(
                      `https://visage.surgeplay.com/full/${uuid}.png`
                    )
                    .setTimestamp()
                    .setURL(`http://plancke.io/hypixel/player/stats/${uuid}`)

                    .addField("IGN:", user, false)
                    .addField("End:", end, false)
                    .addField("Reason:", reason, false);

                  client.channels.cache
                    .get("709370599809613824")
                    .send(embed)
                    .then((blistmsg) => {
                      var msgID = blistmsg.id;
                      blacklist.push({ user, uuid, end, reason, msgID });
                    });

                  fs.writeFile(
                    "blacklist.json",
                    JSON.stringify(blacklist),
                    (err) => {
                      if (err) reject(err);
                      return message.channel.send({
                        embed: {
                          color: 0x2f3136,
                          title: "Done ☑️",
                          thumbnail: `https://crafatar.com/avatars/${MojangAPI.uuid}`,
                          description: `I have added the user \`${MojangAPI.username}\` to the blacklist! To see who is on the blacklist please run \`${process.env.PREFIX}blacklist\` or see <#709370599809613824>`,
                        },
                      });
                    }
                  );
                });
              }
              addUserToBlacklist(
                MojangAPI.username,
                MojangAPI.uuid,
                args[2],
                args.slice(3).join(" ")
              );
            }
            blacklistadd();
          } else if (args[0] == "remove".toLowerCase()) {
            if (!args[1]) {
              return message.channel.send({
                embed: {
                  color: 0x2f3136,
                  title: "Error | Invalid Arguments",
                  description:
                    "```" +
                    process.env.PREFIX +
                    "blacklist <add/remove> <user>\n                        ^^^^^^\nYou must specify a user to remove from the blacklist```",
                },
              });
            }
            async function blacklistremove() {
              try {
                const MojangAPI = await fetch(
                  `https://api.ashcon.app/mojang/v2/user/${args[1]}`
                ).then((res) => res.json());
                if (!MojangAPI.uuid) {
                  return message.channel.send({
                    embed: {
                      color: 0x2f3136,
                      title: "Error",
                      description: `I have encountered an error while attempting your request, a detailed log is below.\n\`\`\`Error: ${MojangAPI.code}, ${MojangAPI.error}\nReason: ${MojangAPI.reason}\`\`\``,
                    },
                  });
                }

                function removeUserFromBlacklist(uuid) {
                  return new Promise((resolve, reject) => {
                    var found = false;
                    for (var i = 0; i < blacklist.length; i++) {
                      if (blacklist[i].uuid == uuid) {
                        found = true;
                        console.log("found uuid");
                        break;
                      }
                    }
                    if (!found) {
                      return message.channel.send({
                        embed: {
                          color: 0x2f3136,
                          title: "Error",
                          description: `That user appears to not be on the blacklist. To check who is on the blacklist please run the \`${process.env.PREFIX}blacklist\` command`,
                        },
                      });
                    }
                    if (found) {
                      for (var i in blacklist) {
                        if (blacklist[i].uuid == uuid) {
                          client.channels.cache
                            .get("709370599809613824")
                            .messages.fetch(blacklist[i].msgID)
                            .then((msg) => {
                              if (!message) {
                                return message.channel.send(
                                  "The message was not found, please delete it manually"
                                );
                              }
                              msg.delete();
                            });
                          blacklist.splice(i, 1);
                          fs.writeFile(
                            "blacklist.json",
                            JSON.stringify(blacklist),
                            (err) => {
                              if (err) reject(err);
                              return message.channel.send({
                                embed: {
                                  color: 0x2f3136,
                                  title: "Done ☑️",
                                  thumbnail: `https://crafatar.com/avatars/${MojangAPI.uuid}`,
                                  description: `I have removed the user \`${MojangAPI.username}\` from the blacklist! To see who is on the blacklist please run \`${process.env.PREFIX}blacklist\` or see <#709370599809613824>`,
                                },
                              });
                            }
                          );
                        }
                      }
                    }
                  });
                }
                removeUserFromBlacklist(MojangAPI.uuid);
              } catch (err) {
                message.channel.send({
                  embed: {
                    color: 0x2f3136,
                    title: "Error",
                    description: `An unexpected error has occurred. Please contact Elijah or if hes at camp whoever he gave console to before he left.`,
                  },
                });
                return console.log(err);
              }
            }
            blacklistremove();
          } else if (args[0] == "dump".toLowerCase()) {
            return message.channel.send({
              embed: {
                color: 0x2f3136,
                title: "Blacklist Dump",
                description: `Attached is the blacklist database, blacklists are stored in an array in a separate \`.JSON\` file. `,
              },
              files: ["./blacklist.json"],
            });
          } else {
            return message.channel.send({
              embed: {
                color: 0x2f3136,
                title: "Error | Invalid Args",
                description: `The second argument does not match up with my code. You must use \`add\`, \`remove\`, or \`dump\``,
              },
            });
          }
        }
      } else {
        return message.channel.send({
          embed: {
            color: 0x2f3136,
            title: "Error",
            description: `It seems you are lacking the permission to run this command.`,
          },
        });
      }
    }
  },
};
