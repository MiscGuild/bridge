export enum HypixelRanks {
	"[VIP]",
	"[VIP+]",
	"[MVP]",
	"[MVP+]",
	"[MVP++]",
}

export enum VerboseHypixelRanks {
	vip,
	vipPlus,
	mvp,
	mvpPlus,
	mvpPlusPlus,
}

export type HypixelRank = keyof typeof HypixelRanks;
export type VerboseHypixelRank = keyof typeof VerboseHypixelRanks;
