import { VerboseHypixelRank } from "./Ranks";

export interface EmojiIds {
	hypixel: Record<VerboseHypixelRank, Emoji[]>;
	guild: Record<string, string[] | undefined>;
}

interface Emoji {
	name: string;
	id: string;
}
