/* eslint no-shadow: 0 */

export enum HypixelRanks {
	"[MVP++]",
	"[MVP+]",
	"[MVP]",
	"[VIP+]",
	"[VIP]",
}

export enum VerboseHypixelRanks {
	mvpPlusPlus,
	mvpPlus,
	mvp,
	vipPlus,
	vip,
}

export type HypixelRank = keyof typeof HypixelRanks;
export type VerboseHypixelRank = keyof typeof VerboseHypixelRanks;
