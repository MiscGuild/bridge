import { HypixelRank, VerboseHypixelRank, VerboseHypixelRanks } from "../../interfaces/Ranks";
import { EmojiIds } from "../../interfaces/EmojiIds";
import _emojiIds from "./_emojiIds.json";
import { ColorResolvable } from "discord.js";

export default async (rank: HypixelRank | undefined): Promise<[rank: string, color: ColorResolvable | undefined]> => {
	const emojiIds = _emojiIds as EmojiIds;
	let rankName: VerboseHypixelRank;

	if (!rank) {
		return ["", 0xaaaaaa];
	}

	switch (rank.trim()) {
		case "[VIP]":
			rankName = "vip";
			break;
		case "[VIP+]":
			rankName = "vipPlus";
			break;
		case "[MVP]":
			rankName = "mvp";
			break;
		case "[MVP+]":
			rankName = "mvpPlus";
			break;
		case "[MVP++]":
			rankName = "mvpPlusPlus";
			break;
		default:
			return [rank, undefined];
	}

	const emojis = emojiIds[rankName];
	if (process.env.USE_RANK_EMOJIS === "true" && emojis !== undefined) {
		return [
			`${emojis.reduce((acc, emoji) => (acc += `<:${emoji.name}:${emoji.id}>`), "")} `,
			VerboseHypixelRanks[rankName],
		];
	}

	return [rank, undefined];
};
