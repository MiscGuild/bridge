import axios from 'axios';
import { BotEvents } from 'mineflayer';
import env from '../util/env';

import bot from '..';

import _blacklist from '../blacklist/_blacklist.json';

interface BlacklistEntry {
  uuid: string;
}

const blacklist = _blacklist as BlacklistEntry[];
const HYPIXEL_API_KEY = env.HYPIXEL_API_KEY;
const PLAYER_UUID = '7f3d4191-7806-4fe5-9d1f-cf617835f56e';

export default class GuildChecker {
  private async fetchGuildMembers(): Promise<string[]> {
    const response = await axios.get(`https://api.hypixel.net/guild`, {
      params: {
        key: HYPIXEL_API_KEY,
        player: PLAYER_UUID // or use byPlayer with a uuid
      }
    });

    if (response.data.success && response.data.guild) {
      return response.data.guild.members.map((member: any) => member.uuid);
    } else {
      throw new Error('Failed to fetch guild data');
    }
  }

  public async refreshBlacklist(): Promise<void> {
    try {
      const guildMembers = await this.fetchGuildMembers();

      const blacklistedInGuild = guildMembers.filter(uuid => blacklist.some(entry => entry.uuid === uuid));

      if (blacklistedInGuild.length > 0) {
        console.log('Blacklisted users found in guild:', blacklistedInGuild);
        // Here you can handle the logic for blacklisted users
        bot.executeCommand(`/gc Blacklisted users found in the guild: ${blacklistedInGuild.join(', ')}`);

        // Mutate the uuid to the current player name using Mojang API
        for (const entry of blacklist) {
          const playerName = await fetch(`https://api.mojang.com/user/profiles/${entry.uuid}/names`)
            .then(res => res.json())
          if (playerName) {
            entry.uuid = playerName;
            // Join in array
            blacklistedInGuild.push(playerName);
          } else {
            console.error(`Failed to fetch player name for UUID: ${entry.uuid}`);
          }
        }
        for (const playerName of blacklistedInGuild) {
          // Kick or notify the user
          bot.executeCommand(`/g kick ${playerName} You have been blacklisted from the guild. Mistake? --> ${env.DISCORD_INVITE_LINK}`);
        }
        
        // Handle logic: notify, log, remove, etc.
      } else {
        console.log('No blacklisted users in guild.');
      }
    } catch (error) {
      console.error('Error checking blacklist:', error);
    }
  }
}
