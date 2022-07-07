/* eslint no-shadow: 0 */

export enum HypixelRanks {
	"[MVP++]",
	"[MVP+]",
	"[MVP]",
	"[VIP+]",
	"[VIP]",
}

export enum VerboseHypixelRanks {
	mvpPlusPlus = 0xffaa00,
	mvpPlus = 0x55ffff,
	mvp = 0x55ffff,
	vipPlus = 0x55ff55,
	vip = 0x55ff55,
}

export type HypixelRank = keyof typeof HypixelRanks;
export type VerboseHypixelRank = keyof typeof VerboseHypixelRanks;
