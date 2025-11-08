/**
 * Example usage of Riot API Client
 * 
 * This file demonstrates how to use the Riot API client to:
 * 1. Get PUUID from gameName + tagLine
 * 2. Get match history
 * 3. Get match details
 */

import { createRiotApiClient } from './riot-api-client';
import { RiotRegion, RiotPlatformId, MatchQueueId } from '@/types/riot';

// Initialize the client with your API key
const riotClient = createRiotApiClient({
  apiKey: process.env.RIOT_API_KEY || 'YOUR_API_KEY_HERE',
  defaultRegion: RiotRegion.AMERICAS,
  defaultPlatformId: RiotPlatformId.NA1,
});

/**
 * Example: Get PUUID from Riot ID
 */
export async function exampleGetPuuid() {
  try {
    // Get PUUID using gameName and tagLine
    const account = await riotClient.getAccountByRiotId('PlayerName', '1234');
    console.log('PUUID:', account.puuid);
    console.log('Game Name:', account.gameName);
    console.log('Tag Line:', account.tagLine);

    // Or use the convenience method
    const puuid = await riotClient.getPuuidByRiotId('PlayerName', '1234');
    console.log('PUUID:', puuid);

    return puuid;
  } catch (error) {
    console.error('Error getting PUUID:', error);
    throw error;
  }
}

/**
 * Example: Get match history
 */
export async function exampleGetMatchHistory(puuid: string) {
  try {
    // Get match IDs (last 20 matches)
    const matchIds = await riotClient.getMatchHistory({
      puuid,
      platformId: RiotPlatformId.NA1,
      count: 20,
    });

    console.log(`Found ${matchIds.length} matches`);
    console.log('Match IDs:', matchIds);

    return matchIds;
  } catch (error) {
    console.error('Error getting match history:', error);
    throw error;
  }
}

/**
 * Example: Get match history with filters
 */
export async function exampleGetFilteredMatchHistory(puuid: string) {
  try {
    // Get only ranked solo/duo matches from the last 7 days
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;

    const matchIds = await riotClient.getMatchHistory({
      puuid,
      platformId: RiotPlatformId.NA1,
      count: 100, // Max 100 matches
      startTime: sevenDaysAgo,
      queue: MatchQueueId.RANKED_SOLO_5V5,
      type: 'ranked',
    });

    console.log(`Found ${matchIds.length} ranked matches`);
    return matchIds;
  } catch (error) {
    console.error('Error getting filtered match history:', error);
    throw error;
  }
}

/**
 * Example: Get match details
 */
export async function exampleGetMatchDetails(matchId: string) {
  try {
    const match = await riotClient.getMatchDetails(matchId, RiotPlatformId.NA1);

    console.log('Match ID:', match.metadata.matchId);
    console.log('Game Duration:', match.info.gameDuration, 'seconds');
    console.log('Game Mode:', match.info.gameMode);
    console.log('Game Version:', match.info.gameVersion);
    console.log('Queue ID:', match.info.queueId);

    // Get participant information
    match.info.participants.forEach((participant, index) => {
      console.log(`\nParticipant ${index + 1}:`);
      console.log('  Summoner Name:', participant.summonerName);
      console.log('  Champion:', participant.championName);
      console.log('  K/D/A:', `${participant.kills}/${participant.deaths}/${participant.assists}`);
      console.log('  Win:', participant.win);
      console.log('  Team Position:', participant.teamPosition);
      console.log('  Damage Dealt:', participant.totalDamageDealtToChampions);
      console.log('  Gold Earned:', participant.goldEarned);
      console.log('  CS:', participant.totalMinionsKilled + participant.neutralMinionsKilled);
    });

    // Get team information
    match.info.teams.forEach((team) => {
      console.log(`\nTeam ${team.teamId}:`);
      console.log('  Win:', team.win);
      console.log('  Baron Kills:', team.objectives.baron.kills);
      console.log('  Dragon Kills:', team.objectives.dragon.kills);
      console.log('  Tower Kills:', team.objectives.tower.kills);
    });

    return match;
  } catch (error) {
    console.error('Error getting match details:', error);
    throw error;
  }
}

/**
 * Example: Get match history with details (all at once)
 */
export async function exampleGetMatchHistoryWithDetails(puuid: string) {
  try {
    // Get match history with full details
    // Note: This makes multiple API calls, so be mindful of rate limits
    const matches = await riotClient.getMatchHistoryWithDetails({
      puuid,
      platformId: RiotPlatformId.NA1,
      count: 10, // Get last 10 matches with details
    });

    console.log(`Retrieved ${matches.length} matches with details`);

    // Analyze matches
    matches.forEach((match, index) => {
      console.log(`\nMatch ${index + 1}:`);
      console.log('  Match ID:', match.metadata.matchId);
      console.log('  Duration:', match.info.gameDuration, 'seconds');
      console.log('  Mode:', match.info.gameMode);

      // Find player in participants
      const player = match.info.participants.find(
        (p) => p.puuid === puuid
      );

      if (player) {
        console.log('  Player Performance:');
        console.log('    Champion:', player.championName);
        console.log('    K/D/A:', `${player.kills}/${player.deaths}/${player.assists}`);
        console.log('    Win:', player.win);
        console.log('    Damage:', player.totalDamageDealtToChampions);
        console.log('    Gold:', player.goldEarned);
      }
    });

    return matches;
  } catch (error) {
    console.error('Error getting match history with details:', error);
    throw error;
  }
}

/**
 * Example: Complete workflow - Get player stats from Riot ID
 */
export async function exampleCompleteWorkflow(gameName: string, tagLine: string) {
  try {
    console.log(`Fetching data for ${gameName}#${tagLine}...`);

    // Step 1: Get PUUID
    const puuid = await riotClient.getPuuidByRiotId(gameName, tagLine);
    console.log(`PUUID: ${puuid}`);

    // Step 2: Get match history
    const matchIds = await riotClient.getMatchHistory({
      puuid,
      count: 5, // Get last 5 matches
    });
    console.log(`Found ${matchIds.length} matches`);

    // Step 3: Get details for each match
    const matches = await Promise.all(
      matchIds.map((matchId) =>
        riotClient.getMatchDetails(matchId, RiotPlatformId.NA1)
      )
    );

    // Step 4: Analyze player performance
    const playerStats = matches.map((match) => {
      const player = match.info.participants.find((p) => p.puuid === puuid);
      if (!player) return null;

      return {
        matchId: match.metadata.matchId,
        champion: player.championName,
        win: player.win,
        kills: player.kills,
        deaths: player.deaths,
        assists: player.assists,
        kda: (player.kills + player.assists) / Math.max(player.deaths, 1),
        damage: player.totalDamageDealtToChampions,
        gold: player.goldEarned,
        cs: player.totalMinionsKilled + player.neutralMinionsKilled,
        visionScore: player.visionScore,
        gameDuration: match.info.gameDuration,
        gameMode: match.info.gameMode,
      };
    }).filter(Boolean);

    console.log('\nPlayer Performance Summary:');
    playerStats.forEach((stats, index) => {
      console.log(`\nMatch ${index + 1}:`);
      console.log(`  Champion: ${stats?.champion}`);
      console.log(`  Result: ${stats?.win ? 'Win' : 'Loss'}`);
      console.log(`  K/D/A: ${stats?.kills}/${stats?.deaths}/${stats?.assists} (${stats?.kda?.toFixed(2)} KDA)`);
      console.log(`  Damage: ${stats?.damage}`);
      console.log(`  Gold: ${stats?.gold}`);
      console.log(`  CS: ${stats?.cs}`);
    });

    return {
      puuid,
      matchIds,
      matches,
      playerStats,
    };
  } catch (error) {
    console.error('Error in complete workflow:', error);
    throw error;
  }
}

/**
 * Example: Get match timeline
 */
export async function exampleGetMatchTimeline(matchId: string) {
  try {
    const timeline = await riotClient.getMatchTimeline(matchId, RiotPlatformId.NA1);

    console.log('Match Timeline:');
    console.log('Frame Interval:', timeline.info.frameInterval, 'ms');
    console.log('Total Frames:', timeline.info.frames.length);

    // Analyze events
    const killEvents = timeline.info.frames
      .flatMap((frame) => frame.events)
      .filter((event) => event.type === 'CHAMPION_KILL');

    console.log(`\nTotal Kills: ${killEvents.length}`);
    killEvents.forEach((kill, index) => {
      console.log(`\nKill ${index + 1}:`);
      console.log('  Timestamp:', kill.timestamp, 'ms');
      console.log('  Killer ID:', kill.killerId);
      console.log('  Victim ID:', kill.victimId);
      console.log('  Assists:', kill.assistingParticipantIds?.join(', ') || 'None');
      if (kill.position) {
        console.log('  Position:', `(${kill.position.x}, ${kill.position.y})`);
      }
    });

    // Analyze participant positions over time
    const playerPuuid = 'PLAYER_PUUID_HERE'; // Replace with actual PUUID
    const playerParticipant = timeline.info.participants.find(
      (p) => p.puuid === playerPuuid
    );

    if (playerParticipant) {
      console.log(`\n\nPlayer ${playerParticipant.participantId} Movement:`);
      timeline.info.frames.forEach((frame, frameIndex) => {
        const participantFrame = frame.participantFrames[playerParticipant.participantId.toString()];
        if (participantFrame) {
          console.log(
            `Frame ${frameIndex}: Level ${participantFrame.level}, ` +
            `Gold: ${participantFrame.currentGold}, ` +
            `Position: (${participantFrame.position.x}, ${participantFrame.position.y})`
          );
        }
      });
    }

    return timeline;
  } catch (error) {
    console.error('Error getting match timeline:', error);
    throw error;
  }
}

/**
 * Example: Get match with timeline (complete match data)
 */
export async function exampleGetMatchWithTimeline(matchId: string) {
  try {
    const { match, timeline } = await riotClient.getMatchWithTimeline(matchId, RiotPlatformId.NA1);

    console.log('Match Details:');
    console.log('Match ID:', match.metadata.matchId);
    console.log('Duration:', match.info.gameDuration, 'seconds');
    console.log('Game Mode:', match.info.gameMode);

    console.log('\nTimeline:');
    console.log('Total Frames:', timeline.info.frames.length);
    console.log('Frame Interval:', timeline.info.frameInterval, 'ms');

    // Find first blood
    const firstBloodEvent = timeline.info.frames
      .flatMap((frame) => frame.events)
      .find((event) => event.type === 'CHAMPION_KILL' && event.killType === 'FIRST_BLOOD');

    if (firstBloodEvent) {
      console.log('\nFirst Blood:');
      console.log('  Timestamp:', firstBloodEvent.timestamp, 'ms');
      console.log('  Killer ID:', firstBloodEvent.killerId);
      console.log('  Victim ID:', firstBloodEvent.victimId);
    }

    // Analyze item purchases over time
    const itemPurchases = timeline.info.frames
      .flatMap((frame) => frame.events)
      .filter((event) => event.type === 'ITEM_PURCHASED');

    console.log(`\nTotal Item Purchases: ${itemPurchases.length}`);
    itemPurchases.forEach((purchase) => {
      console.log(
        `  Participant ${purchase.participantId} purchased item ${purchase.itemId} at ${purchase.timestamp}ms`
      );
    });

    return { match, timeline };
  } catch (error) {
    console.error('Error getting match with timeline:', error);
    throw error;
  }
}

// Example usage (uncomment to run):
// exampleCompleteWorkflow('PlayerName', '1234')
//   .then((result) => {
//     console.log('Workflow completed successfully');
//   })
//   .catch((error) => {
//     console.error('Workflow failed:', error);
//   });

