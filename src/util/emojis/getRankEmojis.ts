import { HypixelRank, VerboseHypixelRank } from "../../interfaces/Ranks";
import { EmojiIds } from "../../interfaces/EmojiIds";
import _emojiIds from "./_emojiIds.json";

export default async (rank: HypixelRank | null) => {
	const emojiIds = _emojiIds as EmojiIds;
	let rankName: VerboseHypixelRank;

	switch (rank) {
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
		case null:
			return "";
		default:
			return rank;
	}

	const emojis = emojiIds[rankName];
	if (process.env.USE_RANK_EMOJIS === "true" && emojis !== undefined) {
		return `${emojis.reduce((previous, current) => (previous += `<:${current.name}:${current.id}>`), "")}`;
	}

	return rank;
};
