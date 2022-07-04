export enum GuildRankColors {
	Gray = "&7",
	"Dark Aqua" = "&3",
	"Dark Green" = "&2",
	Yellow = "&",
	Gold = "&6",
}

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
