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

// Arcade stats interface
export interface Arcade {
    coins?: number;
    wins?: number;
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
    wins_party_2?: number;
    wins_party_3?: number;
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
        [key: string]: any;
    };
    displayname: string;
}

export interface StatsHandler {
    gameMode: string;
    command: string;
    description: string;
    buildStatsMessage: (playerName: string, achievements?: Achievements, stats?: any) => string;
}
