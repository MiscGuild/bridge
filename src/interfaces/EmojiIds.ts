import { VerboseHypixelRank } from "./Ranks";

export type EmojiIds = Record<VerboseHypixelRank, Emoji[]>;

interface Emoji {
	name: string;
	id: string;
}
