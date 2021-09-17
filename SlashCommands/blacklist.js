const { Client, CommandInteraction } = require("discord.js");
const Discord = require("discord.js");
const fetch = require("node-fetch");
const fs = require("fs");
const blacklist = require("../resources/blacklist.json"); // Cant accses the ../resources for some reason
const index = require("../index.js");
const client = index.client;

const successColor = "0x00A86B";
const errorColor = "0xDE3163";

const errorEmbed = new Discord.MessageEmbed()
	.setTitle("Error")
	.setDescription(
		"An error has occurred while running this command. Please contact elijahsus"
	);

module.exports = {
	name: "blacklist",
	description:
    "add / remove a user to the blacklist or list and dump the blacklisted users",
	type: "CHAT_INPUT",
	options: [
		{
			name: "add",
			description: "Add a user to the blacklist",
			type: 1,
			options: [
				{
					name: "user",
					description: "The user to add to the blacklist",
					type: 3,
					required: true,
				},
				{
					name: "end",
					description: "The end date of the blacklist",
					type: 3,
					required: true,
				},
				{
					name: "reason",
					description: "The reason of the blacklist",
					type: 3,
					required: true,
				},
			],
		},
		{
			name: "remove",
			description: "Removes a user from the blacklist",
			type: 1, // 1 is type SUB_COMMAND
			options: [
				{
					name: "user",
					description: "The user to add to the blacklist",
					type: 3,
					required: true,
				},
			],
		},
		{
			name: "list",
			description: "lists all users on the blacklist",
			type: 1,
		},
		{
			name: "dump",
			description: "Dumps the blacklist database",
			type: 1,
		},
	],

	run: async (client, interaction, args) => {
		if (!interaction.member.roles.cache.some((role) => role.name === "Staff")) {
			const embed = new Discord.MessageEmbed()
				.setTitle("Error")
				.setDescription(
					"It seems you are lacking the permission to run this command."
				);
			return interaction.followUp({ embeds: [embed], ephemeral: true });
		}

		if (args[0] == "list") {
			const embed = new Discord.MessageEmbed()
				.setTitle("Blacklist")
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
					.setTitle("Error | Too many people on blacklist")
					.setDescription(
						`Discord has a character limit and we have reached it with the message trying to be sent. Look at the blacklist list in <#${process.env.BLACKLISTCHANNEL}>`
					);
				return interaction.followUp({ embeds: [embed2], ephemeral: true });
			}
			return interaction.followUp({ embeds: [embed] });
		}
		else if (args[0] == "dump") {
			const embed = new Discord.MessageEmbed()
				.setTitle("Blacklist Dump")
				.setDescription(
					"Attached is the blacklist database, blacklists are stored in an array in a separate `.JSON` file. "
				);
			return interaction.followUp({
				embeds: [embed],
				files: [`${process.cwd()}/blacklist.json`],
			});
		}
		else if (args[0] == "add") {
			if (!args[1]) {
				const embed = new Discord.MessageEmbed()
					.setTitle("Error | Invalid Arguments")
					.setDescription(
						"```/blacklist <add/remove> <user>\n                        ^^^^^^\nYou must specify a user to add to the blacklist```"
					);

				return interaction.followUp({ embeds: [embed], ephemeral: true });
			}

			if (!args[2]) {
				const embed = new Discord.MessageEmbed()
					.setTitle("Error | Invalid Arguments")
					.setColor(errorColor)
					.setDescription(
						"```/blacklist add <user> <end> <reason>\n                      ^^^^^\nYou must specify an end date (It can be never)```"
					);

				return interaction.followUp({ embeds: [embed], ephemeral: true });
			}

			if (!args[3]) {
				const embed = new Discord.MessageEmbed()
					.setTitle("Error | Invalid Arguments")
					.setColor(errorColor)
					.setDescription(
						"```/blacklist add <user> <end> <reason>\n                               ^^^^^\nYou must specify a reason for the blacklist```"
					);

				return interaction.followUp({ embeds: [embed], ephemeral: true });
			}

			const MojangAPI = await fetch(
				`https://api.ashcon.app/mojang/v2/user/${args[1]}`
			).then((res) => res.json());
			if (!MojangAPI.uuid) {
				const embed = new Discord.MessageEmbed()
					.setTitle("Error")
					.setColor(errorColor)
					.setDescription(
						`I have encountered an error while attempting your request, a detailed log is below.\n\`\`\`Error: ${MojangAPI.code}, ${MojangAPI.error}\nReason: ${MojangAPI.reason}\`\`\``
					);
				return interaction.followUp({ embeds: [embed], ephemeral: true });
			}

			for (const i in blacklist) {
				if (blacklist[i].uuid == MojangAPI.uuid) {
					const embed = new Discord.MessageEmbed()
						.setTitle("Error")
						.setColor(errorColor)
						.setDescription(
							`That user appears to already be on the blacklist. To check who is on the blacklist please run the \`${process.env.PREFIX}blacklist\` command`
						);
					return interaction.followUp({ embeds: [embed], ephemeral: true });
				}
			}

			const user = MojangAPI.username;
			const uuid = MojangAPI.uuid;
			const end = args[2];
			const reason = args.slice(3).join(" ");

			return new Promise((resolve, reject) => {
				const embed = new Discord.MessageEmbed()
					.setTitle(user)
					.setAuthor(
						"Blacklist",
						"https://media.discordapp.net/attachments/522930879413092388/849317688517853294/misc.png"
					) /*           * Alternatively, use "#00AE86", [0, 174, 134] or an integer number.           */
					.setColor("ff0000")
					.setFooter(`UUID: ${uuid}`)
					.setThumbnail(`https://visage.surgeplay.com/full/${uuid}.png`)
					.setTimestamp()
					.setURL(`http://plancke.io/hypixel/player/stats/${uuid}`)

					.addField("IGN:", user, false)
					.addField("End:", end, false)
					.addField("Reason:", reason, false);

				client.channels.cache
					.get(process.env.BLACKLISTCHANNEL)
					.send({ embeds: [embed] })
					.then((blistmsg) => {
						const msgID = blistmsg.id;

						blacklist.push({ user, uuid, end, reason, msgID });

						fs.writeFile(
							"blacklist.json", // Cant accses the /resources for some reason
							JSON.stringify(blacklist),
							(err) => {
								if (err) {
									reject(err);
								}
								const embed = new Discord.MessageEmbed()
									.setTitle("Done ☑️")
									.setColor(successColor)
									.setThumbnail(
										`https://crafatar.com/avatars/${MojangAPI.uuid}`
									)
									.setDescription(
										`I have added the user \`${MojangAPI.username}\` to the blacklist! To see who is on the blacklist please run \`${process.env.PREFIX}blacklist\` or see <#${process.env.BLACKLISTCHANNEL}>`
									);
								return interaction.followUp({ embeds: [embed] });
							}
						);
					});
			});
		}
		else if (args[0] == "remove") {
			if (!args[1]) {
				const embed = new Discord.MessageEmbed()
					.setTitle("Error | Invalid Arguments")
				// .setColor(`https://crafatar.com/avatars/${MojangAPI.uuid}`)
					.setDescription(
						"```/blacklist <add/remove> <user>\n                        ^^^^^^\nYou must specify a user to remove from the blacklist```"
					);
				return interaction.followUp({ embeds: [embed], ephemeral: true });
			}

			try {
				const MojangAPI = await fetch(
					`https://api.ashcon.app/mojang/v2/user/${args[1]}`
				).then((res) => res.json());
				if (!MojangAPI.uuid) {
					const embed = new Discord.MessageEmbed()
						.setTitle("Error")
						.setColor(errorColor)
						.setDescription(
							`I have encountered an error while attempting your request, a detailed log is below.\n\`\`\`Error: ${MojangAPI.code}, ${MojangAPI.error}\nReason: ${MojangAPI.reason}\`\`\``
						);
					return interaction.followUp({ embeds: [embed], ephemeral: true });
				}

				const uuid = MojangAPI.uuid;
				return new Promise((resolve, reject) => {
					let found = false;
					for (let i = 0; i < blacklist.length; i++) {
						if (blacklist[i].uuid == uuid) {
							found = true;
							console.log("found uuid");
							break;
						}
					}
					if (!found) {
						const embed = new Discord.MessageEmbed()
							.setTitle("Error")
							.setColor(errorColor)
							.setDescription(
								"That user appears to not be on the blacklist. To check who is on the blacklist please run the `/blacklist` command"
							);
						return interaction.followUp({
							embeds: [embed],
							ephemeral: true,
						});
					}
					if (found) {
						for (const i in blacklist) {
							if (blacklist[i].uuid == uuid) {
								client.channels.cache
									.get(process.env.BLACKLISTCHANNEL)
									.messages.fetch(blacklist[i].msgID)
									.then((msg) => {
										if (!msg) {
											return interaction.followUp(
												"The message was not found, please delete it manually",
												{ ephemeral: true }
											);
										}
										msg.delete();
									});
								blacklist.splice(i, 1);
								fs.writeFile(
									"blacklist.json",
									JSON.stringify(blacklist),
									(err) => {
										if (err) {
											reject(err);
										}
										const embed = new Discord.MessageEmbed()
											.setTitle("Done ☑️")
											.setColor(successColor)
											.setThumbnail(
												`https://crafatar.com/avatars/${MojangAPI.uuid}`
											)
											.setDescription(
												`I have removed the user \`${MojangAPI.username}\` from the blacklist! To see who is on the blacklist please run \`${process.env.PREFIX}blacklist\` or see <#${process.env.BLACKLISTCHANNEL}>`
											);
										return interaction.followUp({ embeds: [embed] });
									}
								);
							}
						}
					}
				});

			}
			catch (err) {
				const embed = new Discord.MessageEmbed()
					.setTitle("Error")
					.setColor(errorColor)
					.setDescription(
						"An unexpected error has occurred. Please contact ElijahROOS."
					);
				return interaction.followUp({ embeds: [embed] });
			}
		}
		else {
			interaction.followUp({ embeds: [errorEmbed] });
		}
	},
};
