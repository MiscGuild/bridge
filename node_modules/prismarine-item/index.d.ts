/// <reference types="node" />

declare class Item {
    constructor(type: number, count: number, metadata?: number, nbt?: object);
    type: number;
    slot: number;
    count: number;
    metadata: number;
    nbt: Buffer | null;
    name: string;
    displayName: string;
    stackSize: number;
    durabilityUsed: number;
    enchants: NormalizedEnchant[];
    repairCost: number;
    customName: string;
    static equal(item1: Item, item2: Item, matchStackSize: boolean): boolean;
    static toNotch(item: Item): NotchItem;
    static fromNotch(item: NotchItem): Item;
    static anvil (itemOne: Item, itemTwo: Item | null, creative: boolean, rename: string | undefined): {xpCost: number, item: Item}
}
declare interface NotchItem {
    // 1.8 - 1.12
    blockId?: number;
    itemDamage?: number;
    // 1.13 - 1.15
    present?: boolean;
    itemId?: number;

    itemCount?: number;
    nbtData?: Buffer;
}

declare interface NormalizedEnchant {
    name: string;
    lvl: number
}

export declare function loader(mcVersion: string): keyof Item;
