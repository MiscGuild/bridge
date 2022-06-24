import { MessageEmbed, TextChannel } from "discord.js";
import { BlacklistEntry } from "../interfaces/BlacklistEntry";
import { Command } from "../interfaces/DiscordCommand";
import _blacklist from "../util/_blacklist.json";
import fetchErrorEmbed from "../util/fetchErrorEmbed";
import fetchMojangProfile from "../util/fetchMojangProfile";
import isFetchError from "../util/isFetchError";
import writeToBlacklist from "../util/writeToBlacklist";

export default {
	data: {
		name: "blacklist",
		description: "Add or remove a user from the blacklist!",
		options: [
			{
				name: "add",
				description: "Add a user to the blacklist",
				type: "SUB_COMMAND",
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
						description: "The reason for the blacklist",
						type: 3,
						required: true,
					},
				],
			},
			{
				name: "remove",
				description: "Removes a user from the blacklist",
				type: "SUB_COMMAND",
				options: [
					{
						name: "user",
						description: "The user to remove from the blacklist",
						type: 3,
						required: true,
					},
				],
			},
		],
	},

	run: async (bot, interaction, args) => {
		const type = interaction.options.getSubcommand() as "add" | "remove";
		const mojangProfile = await fetchMojangProfile(args[0]);
		const blacklist = _blacklist as BlacklistEntry[];

		if (isFetchError(mojangProfile)) {
			const embed = fetchErrorEmbed(mojangProfile);
			return await interaction.reply({ embeds: [embed] });
		}

		const isOnBlacklist = blacklist.some((user) => user.uuid === mojangProfile.id);
		if ((type === "add" && isOnBlacklist) || (type === "remove" && !isOnBlacklist)) {
			const embed = new MessageEmbed()
				.setColor("RED")
				.setTitle("Error")
				.setDescription(`That user is ${type === "add" ? "already" : "not"} on the blacklist!`);

			return await interaction.reply({ embeds: [embed] });
		}

		if (type === "add") {
			const endDate = args[1];
			const reason = args[2];
			const embed = new MessageEmbed()
				.setAuthor({
					name: "Blacklist",
					iconURL: "https://media.discordapp.net/attachments/522930879413092388/849317688517853294/misc.png",
				})
				.setColor("RED")
				.setFooter({ text: `UUID: ${mojangProfile.id}` })
				.setThumbnail(`https://visage.surgeplay.com/full/${mojangProfile.id}.png`)
				.setTimestamp()
				.setTitle(mojangProfile.name)
				.setURL(`http://plancke.io/hypixel/player/stats/${mojangProfile.id}`)
				.addField("End:", endDate)
				.addField("Reason:", reason);

			const blacklistMessage = await (
				(await bot.discord.channels.fetch(process.env.BLACKLIST_CHANNEL_ID)) as TextChannel
			).send({
				embeds: [embed],
			});

			blacklist.push({
				name: mojangProfile.name,
				uuid: mojangProfile.id,
				endDate: endDate,
				reason: reason,
				messageId: blacklistMessage.id,
			});
		} else {
			const blacklistEntry = blacklist.find((user) => user.uuid === mojangProfile.id) as BlacklistEntry;
			blacklist.splice(blacklist.indexOf(blacklistEntry));

			const message = await (
				bot.discord.channels.cache.get(process.env.BLACKLIST_CHANNEL_ID) as TextChannel
			).messages.fetch(blacklistEntry.messageId);
			await message.delete();
		}

		const successEmbed = new MessageEmbed()
			.setColor(type === "add" ? "RED" : "GREEN")
			.setThumbnail(`https://crafatar.com/avatars/${mojangProfile.id}`)
			.setTitle("Completed!")
			.setDescription(`${mojangProfile.name} was ${type === "add" ? "added to" : "removed from"} the blacklist!`);

		writeToBlacklist(blacklist, interaction, successEmbed);
	},
} as Command;
