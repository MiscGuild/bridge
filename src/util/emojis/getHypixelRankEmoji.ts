import { HypixelRank, VerboseHypixelRank } from "../../interfaces/Ranks";
import { EmojiIds } from "../../interfaces/EmojiIds";
import _emojiIds from "./_emojiIds.json";

export default async (rank: HypixelRank) => {
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
	default:
		return rank;
	}

	// TODO: processenv variable for activating emoji ranks

	const emojis = emojiIds[rankName];
	return `${emojis.reduce((previous, current) => (previous += `<:${current.name}:${current.id}>`), "")}`;
};
