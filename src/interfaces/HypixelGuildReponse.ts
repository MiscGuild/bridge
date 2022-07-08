/**
 * Source: https://github.com/unaussprechlich/hypixel-api-typescript/
 */
export interface HypixelGuildResponse {
	_id: string;
	name: string;
	coins: number;
	memberSizeLevel: number;
	bankSizeLevel: number;
	coinsEver: number;
	created: number;
	members: Member[];
	canParty: boolean;
	canTag: boolean;
	tag?: string;
	banner?: Banner;
	canMotd?: boolean;
	vipCount?: number;
	mvpCount?: number;
	tagColor?: string;
}

interface Member {
	uuid: string;
	rank: string;
	joined: number;
	expHistory: { [key: number]: number };
}

interface Banner {
	Base?: string;
	Patterns?: Pattern[];
}

interface Pattern {
	Pattern?: string;
	Color?: string | number;
}
