import { VerboseHypixelRank } from "./Ranks";

export type EmojiIds = { [key in VerboseHypixelRank]?: Emoji[] };

export interface Emoji {
	name: string;
	id: string;
}
