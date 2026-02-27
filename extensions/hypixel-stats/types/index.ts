/**
 * Type definitions for Hypixel Stats Extension
 */

export interface ChatMessageContext {
    message: string;
    username: string;
    channel?: 'Guild' | 'Officer' | 'From' | 'Party' | string;
    rank?: string;
    guildRank?: string;
    timestamp: Date;
    raw: string;
    matches?: RegExpMatchArray;
}

export interface ExtensionAPI {
    log: any;
    events: any;
    config: any;
    chat: {
        sendGuildChat: (message: string) => void;
        sendOfficerChat: (message: string) => void;
        sendPrivateMessage: (username: string, message: string) => void;
        sendPartyMessage: (message: string) => void;
    };
    discord: {
        send: (channelId: string, content: any, color?: number, ping?: boolean) => Promise<any>;
        sendMessage: (channelId: string, content: any) => Promise<any>;
        sendEmbed: (channelId: string, embed: any) => Promise<any>;
    };
    utils: Record<string, any>;
}

export interface ChatPattern {
    id: string;
    extensionId: 'hypixel-stats';
    pattern: RegExp;
    priority: number;
    description?: string;
    passthrough?: boolean;
    handler: (context: ChatMessageContext, api: ExtensionAPI) => Promise<void> | void;
}

export interface FetchError {
    status: number;
    statusText: string;
}

export interface MojangProfile {
    id: string;
    name: string;
}

export interface Achievements {
    bedwars_level?: number;
    bedwars_wins?: number;
    bedwars_beds?: number;
    bedwars_loot_box?: number;
    skywars_level?: number;
    skywars_wins?: number;
    skywars_kills?: number;
    general_wins?: number;
    general_coins?: number;
    paintball_wins?: number;
    paintball_kills?: number;
    quake_wins?: number;
    quake_kills?: number;
    tntgames_bow_spleef_wins?: number;
    tntgames_tnt_run_wins?: number;
    tntgames_wizards_wins?: number;
    walls_wins?: number;
    walls_kills?: number;
    vampirez_survivor_wins?: number;
    vampirez_kill_survivors?: number;
    vampirez_kill_vampires?: number;
    arcade_coins?: number;
    blitz_coins?: number;
    blitz_wins?: number;
    blitz_kills?: number;
}

// Bedwars stats interface
export interface Bedwars {
    eight_one_wins_bedwars?: number;
    eight_two_wins_bedwars?: number;
    four_three_wins_bedwars?: number;
    four_four_wins_bedwars?: number;
    two_four_wins_bedwars?: number;
    eight_one_losses_bedwars?: number;
    eight_two_losses_bedwars?: number;
    four_three_losses_bedwars?: number;
    four_four_losses_bedwars?: number;
    two_four_losses_bedwars?: number;
    eight_one_beds_broken_bedwars?: number;
    eight_two_beds_broken_bedwars?: number;
    four_three_beds_broken_bedwars?: number;
    four_four_beds_broken_bedwars?: number;
    two_four_beds_broken_bedwars?: number;
    eight_one_beds_lost_bedwars?: number;
    eight_two_beds_lost_bedwars?: number;
    four_three_beds_lost_bedwars?: number;
    four_four_beds_lost_bedwars?: number;
    two_four_beds_lost_bedwars?: number;
    eight_one_final_kills_bedwars?: number;
    eight_two_final_kills_bedwars?: number;
    four_three_final_kills_bedwars?: number;
    four_four_final_kills_bedwars?: number;
    two_four_final_kills_bedwars?: number;
    eight_one_final_deaths_bedwars?: number;
    eight_two_final_deaths_bedwars?: number;
    four_three_final_deaths_bedwars?: number;
    four_four_final_deaths_bedwars?: number;
    two_four_final_deaths_bedwars?: number;
    kills_bedwars?: number;
    deaths_bedwars?: number;
    games_played_bedwars?: number;
}

// SkyWars stats interface
export interface SkyWars {
    level?: number;
    experience?: number;
    skywars_experience?: number;
    wins?: number;
    losses?: number;
    kills?: number;
    deaths?: number;
    games_played_skywars?: number;
    coins?: number;
    souls?: number;
    wins_solo_normal?: number;
    wins_solo_insane?: number;
    wins_team_normal?: number;
    wins_team_insane?: number;
    losses_solo_normal?: number;
    losses_solo_insane?: number;
    losses_team_normal?: number;
    losses_team_insane?: number;
    kills_solo_normal?: number;
    kills_solo_insane?: number;
    kills_team_normal?: number;
    kills_team_insane?: number;
    deaths_solo_normal?: number;
    deaths_solo_insane?: number;
    deaths_team_normal?: number;
    deaths_team_insane?: number;
}

// Duels stats interface
export interface Duels {
    wins?: number;
    losses?: number;
    kills?: number;
    deaths?: number;
    games_played_duels?: number;
    coins?: number;
    bow_wins?: number;
    bow_losses?: number;
    classic_duel_wins?: number;
    classic_duel_losses?: number;
    potion_duel_wins?: number;
    potion_duel_losses?: number;
    sw_duel_wins?: number;
    sw_duel_losses?: number;
    uhc_duel_wins?: number;
    uhc_duel_losses?: number;
    combo_duel_wins?: number;
    combo_duel_losses?: number;
    op_duel_wins?: number;
    op_duel_losses?: number;
}

// UHC stats interface
export interface UHC {
    wins?: number;
    wins_solo?: number;
    wins_team?: number;
    kills?: number;
    deaths?: number;
    coins?: number;
    score?: number;
    heads_eaten?: number;
    ultimates_crafted?: number;
}

// Build Battle stats interface
export interface BuildBattle {
    wins?: number;
    games_played?: number;
    score?: number;
    coins?: number;
    correct_guesses?: number;
    wins_solo_normal?: number;
    wins_teams_normal?: number;
    wins_guess_the_build?: number;
    wins_solo_pro?: number;
}

// Murder Mystery stats interface
export interface MurderMystery {
    wins?: number;
    games?: number;
    kills?: number;
    deaths?: number;
    coins?: number;
    murderer_wins?: number;
    detective_wins?: number;
    wins_MURDER_CLASSIC?: number;
    wins_MURDER_DOUBLE_UP?: number;
    wins_MURDER_ASSASSINS?: number;
    kills_as_murderer?: number;
    kills_as_survivor?: number;
}

// TNT Games stats interface
export interface TNTGames {
    wins?: number;
    coins?: number;
    wins_tntrun?: number;
    wins_pvprun?: number;
    wins_bowspleef?: number;
    wins_tntag?: number;
    wins_capture?: number;
    record_tntrun?: number;
    deaths_tntrun?: number;
    kills_bowspleef?: number;
    deaths_bowspleef?: number;
}

// Mega Walls stats interface
export interface Walls3 {
    wins?: number;
    losses?: number;
    kills?: number;
    deaths?: number;
    assists?: number;
    games_played?: number;
    coins?: number;
    final_kills?: number;
    final_deaths?: number;
    chosen_class?: string;
}

// Pit stats interface
export interface Pit {
    profile?: {
        kills?: number;
        deaths?: number;
        assists?: number;
        prestige?: number;
        level?: number;
        cash?: number;
        bounties?: number;
        [key: string]: any;
    };
    pit_stats_ptl?: any;
    [key: string]: any;
}

// Arcade stats interface
export interface Arcade {
    coins?: number;
    // Note: There is no general 'wins' field in the API response
    // Total wins should be calculated by summing specific wins fields
    wins_party?: number;
    wins_hole_in_the_wall?: number;
    wins_galaxy_wars?: number;
    wins_dragonwars2?: number;
    wins_dayone?: number;
    wins_simon_says?: number;
    wins_santa_says?: number;
    wins_mini_walls?: number;
    wins_farm_hunt?: number;
    wins_creeper_attack?: number;
    wins_throw_out?: number;
    wins_easter_simulator?: number;
    wins_scuba_simulator?: number;
    wins_halloween_simulator?: number;
    wins_grinch_simulator?: number;
    wins_grinch_simulator_v2?: number;
    wins_party_2?: number;
    wins_party_3?: number;
    wins_ender?: number;
    wins_soccer?: number;
    wins_zombies?: number;
    wins_zombies_deadend?: number;
    wins_zombies_deadend_normal?: number;
    wins_zombies_prison?: number;
    wins_zombies_prison_normal?: number;
    wins_oneinthequiver?: number;
    pixel_party?: {
        wins?: number;
        wins_normal?: number;
        wins_hyper?: number;
    };
}

// Cops and Crims stats interface
export interface MCGO {
    kills?: number;
    deaths?: number;
    game_wins?: number;
    round_wins?: number;
    shots_fired?: number;
    headshot_kills?: number;
    cop_kills?: number;
    criminal_kills?: number;
    bombs_planted?: number;
    bombs_defused?: number;
    coins?: number;
}

export interface SkyBlock {
    // Player Profile Info
    profiles?: { [profileName: string]: any };

    // Experience and levels
    experience?: number;

    // SkyBlock skills
    skill_farming?: number;
    skill_mining?: number;
    skill_combat?: number;
    skill_foraging?: number;
    skill_fishing?: number;
    skill_enchanting?: number;
    skill_alchemy?: number;
    skill_carpentry?: number;
    skill_runecrafting?: number;
    skill_social?: number;
    skill_taming?: number;

    // Collections
    collection_wheat?: number;
    collection_carrot?: number;
    collection_potato?: number;
    collection_pumpkin?: number;
    collection_melon?: number;
    collection_mushroom?: number;
    collection_cocoa?: number;
    collection_cactus?: number;
    collection_sugar_cane?: number;
    collection_nether_wart?: number;

    // Mining collections
    collection_cobblestone?: number;
    collection_iron_ingot?: number;
    collection_gold_ingot?: number;
    collection_diamond?: number;
    collection_lapis_lazuli?: number;
    collection_emerald?: number;
    collection_redstone?: number;
    collection_coal?: number;
    collection_obsidian?: number;
    collection_glowstone_dust?: number;
    collection_quartz?: number;
    collection_ender_stone?: number;

    // Combat collections
    collection_rotten_flesh?: number;
    collection_bone?: number;
    collection_string?: number;
    collection_spider_eye?: number;
    collection_gunpowder?: number;
    collection_ender_pearl?: number;
    collection_blaze_rod?: number;
    collection_magma_cream?: number;
    collection_ghast_tear?: number;
    collection_slime_ball?: number;

    // Foraging collections
    collection_log?: number;
    collection_log_2?: number;
    collection_log_jungle?: number;
    collection_log_spruce?: number;
    collection_log_birch?: number;
    collection_log_acacia?: number;
    collection_log_dark_oak?: number;

    // Fishing collections
    collection_raw_fish?: number;
    collection_raw_salmon?: number;
    collection_clownfish?: number;
    collection_pufferfish?: number;
    collection_prismarine_shard?: number;
    collection_prismarine_crystals?: number;
    collection_clay_ball?: number;
    collection_water_lily?: number;
    collection_ink_sack?: number;
    collection_sponge?: number;

    // Pet info
    pets?: Array<{
        uuid?: string;
        type?: string;
        exp?: number;
        tier?: string;
        heldItem?: string;
        candyUsed?: number;
        skin?: string;
    }>;

    // Dungeon stats
    dungeons?: {
        dungeon_types?: {
            catacombs?: {
                times_played?: { [floor: string]: number };
                tier_completions?: { [floor: string]: number };
                fastest_time?: { [floor: string]: number };
                best_runs?: { [floor: string]: any };
                experience?: number;
                mobs_killed?: number;
                most_damage?: { [className: string]: number };
                milestone_completions?: { [milestone: string]: number };
            };
        };
        selected_dungeon_class?: string;
        player_classes?: {
            healer?: { experience?: number };
            mage?: { experience?: number };
            berserk?: { experience?: number };
            archer?: { experience?: number };
            tank?: { experience?: number };
        };
    };

    // Slayer stats
    slayer_bosses?: {
        zombie?: {
            claimed_levels?: { [tier: string]: boolean };
            xp?: number;
            kills_tier_0?: number;
            kills_tier_1?: number;
            kills_tier_2?: number;
            kills_tier_3?: number;
            kills_tier_4?: number;
        };
        spider?: {
            claimed_levels?: { [tier: string]: boolean };
            xp?: number;
            kills_tier_0?: number;
            kills_tier_1?: number;
            kills_tier_2?: number;
            kills_tier_3?: number;
            kills_tier_4?: number;
        };
        wolf?: {
            claimed_levels?: { [tier: string]: boolean };
            xp?: number;
            kills_tier_0?: number;
            kills_tier_1?: number;
            kills_tier_2?: number;
            kills_tier_3?: number;
            kills_tier_4?: number;
        };
        enderman?: {
            claimed_levels?: { [tier: string]: boolean };
            xp?: number;
            kills_tier_0?: number;
            kills_tier_1?: number;
            kills_tier_2?: number;
            kills_tier_3?: number;
            kills_tier_4?: number;
        };
        blaze?: {
            claimed_levels?: { [tier: string]: boolean };
            xp?: number;
            kills_tier_0?: number;
            kills_tier_1?: number;
            kills_tier_2?: number;
            kills_tier_3?: number;
            kills_tier_4?: number;
        };
        vampire?: {
            claimed_levels?: { [tier: string]: boolean };
            xp?: number;
            kills_tier_0?: number;
            kills_tier_1?: number;
            kills_tier_2?: number;
            kills_tier_3?: number;
            kills_tier_4?: number;
        };
    };

    // Bank and purse
    coin_purse?: number;

    // Misc stats
    deaths?: number;
    kills?: number;
    items_fished?: number;
    items_fished_treasure?: number;
    items_fished_large_treasure?: number;
    auctions_bids?: number;
    auctions_highest_bid?: number;
    auctions_won?: number;
    auctions_created?: number;
    auctions_fees?: number;
    auctions_completed?: number;

    // Jacob's farming
    jacobs_contest?: {
        medals_inv?: {
            gold?: number;
            silver?: number;
            bronze?: number;
        };
        perks?: {
            double_drops?: number;
            farming_level_cap?: number;
            personal_bests?: boolean;
        };
        contests?: { [contest: string]: any };
    };
}

export interface HypixelPlayerResponse {
    id: string;
    achievements?: Achievements;
    stats?: {
        Bedwars?: Bedwars;
        SkyWars?: SkyWars;
        Duels?: Duels;
        UHC?: UHC;
        BuildBattle?: BuildBattle;
        MurderMystery?: MurderMystery;
        TNTGames?: TNTGames;
        Walls3?: Walls3;
        Arcade?: Arcade;
        MCGO?: MCGO;
        Pit?: Pit;
        SkyBlock?: SkyBlock;
        [key: string]: any;
    };
    displayname: string;
}

export interface StatsHandler {
    gameMode: string;
    command: string;
    aliases?: string[]; // Optional array of alternative commands
    description: string;
    buildStatsMessage: (
        playerName: string,
        achievements?: Achievements,
        stats?: any,
        api?: any
    ) => string | Promise<string>;
}
