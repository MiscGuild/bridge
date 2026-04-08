/**
 * SkyBlock Collections Handler
 */

import { Achievements, SkyBlock, StatsHandler } from '../../types';
import { getRandomHexColor } from '../../utils';

export const skyblockCollectionsHandler: StatsHandler = {
    gameMode: 'SkyBlock Collections',
    command: 'sb collections',
    description: 'Check SkyBlock collections',
    buildStatsMessage: (
        playerName: string,
        achievements?: Achievements,
        stats?: SkyBlock
    ): string => {
        if (!stats) {
            return `No SkyBlock collection data found for ${playerName}. Are they nicked? | ${getRandomHexColor()}`;
        }

        // Farming collections
        const wheat = stats.collection_wheat ?? 0;

        // Mining collections
        const cobblestone = stats.collection_cobblestone ?? 0;
        const iron = stats.collection_iron_ingot ?? 0;
        const diamond = stats.collection_diamond ?? 0;
        const coal = stats.collection_coal ?? 0;

        // Combat collections
        const rottenFlesh = stats.collection_rotten_flesh ?? 0;
        const enderPearl = stats.collection_ender_pearl ?? 0;

        // Foraging collections
        const oakLog = stats.collection_log ?? 0;

        // Fishing collections
        const rawFish = stats.collection_raw_fish ?? 0;

        // Format numbers
        const formatNumber = (num: number): string => {
            if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
            if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
            return num.toLocaleString();
        };

        // Find top 3 collections overall
        const allCollections = [
            { name: 'Wheat', value: wheat },
            { name: 'Cobble', value: cobblestone },
            { name: 'Iron', value: iron },
            { name: 'Oak Log', value: oakLog },
            { name: 'Raw Fish', value: rawFish },
            { name: 'Rotten Flesh', value: rottenFlesh },
            { name: 'Coal', value: coal },
            { name: 'Diamond', value: diamond },
            { name: 'Ender Pearl', value: enderPearl },
        ]
            .sort((a, b) => b.value - a.value)
            .slice(0, 3);

        return `${playerName} Collections: ${allCollections.map((c) => `${c.name} ${formatNumber(c.value)}`).join(', ')} ${getRandomHexColor()}`;
    },
};
