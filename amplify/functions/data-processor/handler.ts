import type { Handler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';
import type { MatchDto, ParticipantDto, MatchInfoDto } from '../../types/riot/match-v5';
import { RiotApiClient } from '../riot-api/riot-api-client';
import { RiotPlatformId } from '../../types/riot/index';

if (!process.env.DATA_GRAPHQL_ENDPOINT || !process.env.AWS_REGION) {
  throw new Error('Required environment variables missing: DATA_GRAPHQL_ENDPOINT, AWS_REGION');
}

if (!process.env.RIOT_API_KEY) {
  throw new Error('RIOT_API_KEY environment variable is required');
}

Amplify.configure({
  API: {
    GraphQL: {
      endpoint: process.env.DATA_GRAPHQL_ENDPOINT,
      region: process.env.AWS_REGION,
      defaultAuthMode: 'apiKey'
    }
  }
});

const client = generateClient<Schema>();

// Initialize Riot API client
const riotClient = new RiotApiClient({
  apiKey: process.env.RIOT_API_KEY!,
});

/**
 * Amplify Gen 2 GraphQL Mutation Handler
 * 
 * Handles processMatches mutation:
 * - Fetches match data from Riot API
 * - Processes match data and stores in MatchCache and MatchParticipantIndex
 */
interface GraphQLMutationEvent {
  arguments: {
    puuid: string;
    matches?: any; // Optional: Array of match data (if provided, skip fetching)
    matchIds?: string[]; // Optional: Array of match IDs to fetch
    count?: number; // Optional: Number of matches to fetch (default: 20)
    platformId?: string; // Optional: Platform ID for Riot API
  };
  identity?: any;
  source?: any;
  request?: any;
  prev?: any;
  info?: any;
}

export const handler: Handler<GraphQLMutationEvent, any> = async (event) => {
  try {
    const { puuid, matches, matchIds, count, platformId } = event.arguments;
    
    if (!puuid) {
      const errorResponse = {
        success: false,
        error: {
          message: 'Missing required argument: puuid',
          code: 'MISSING_ARGUMENT',
          statusCode: 400,
          details: {
            receivedArguments: Object.keys(event.arguments || {}),
          },
          timestamp: new Date().toISOString(),
        }
      };
      
      // Log the full error response
      console.error('Error response from processMatches (missing argument):', JSON.stringify(errorResponse, null, 2));
      
      return errorResponse;
    }
    
    let matchesToProcess: MatchDto[] = [];
    
    // If matches are provided directly, use them
    if (matches && Array.isArray(matches) && matches.length > 0) {
      matchesToProcess = matches;
    } 
    // If match IDs are provided, fetch match details for each
    else if (matchIds && Array.isArray(matchIds) && matchIds.length > 0) {
      console.log(`Fetching ${matchIds.length} match details from Riot API...`);
      matchesToProcess = await Promise.all(
        matchIds.map(async (matchId: string) => {
          try {
            return await riotClient.getMatchDetails(
              matchId,
              platformId as RiotPlatformId | undefined
            );
          } catch (error) {
            console.error(`Failed to fetch match ${matchId}:`, error);
            throw error;
          }
        })
      );
    }
    // Otherwise, fetch match history and then match details
    else {
      console.log(`Fetching match history for puuid: ${puuid} (last 365 days)...`);
      try {
        const matchIdsList = await riotClient.getMatchHistory({
          puuid,
          platformId: platformId as RiotPlatformId | undefined,
          count: count || 20,
          start: 0,
          // startTime is automatically set to 365 days ago in riot-api-client
        });
        
        if (!matchIdsList || matchIdsList.length === 0) {
          return {
            success: true,
            processed: 0,
            puuid,
            message: 'No matches found for this player in the last year',
          };
        }
        
        console.log(`Found ${matchIdsList.length} matches from the last year, fetching details...`);
        matchesToProcess = await Promise.all(
          matchIdsList.map(async (matchId: string) => {
            try {
              return await riotClient.getMatchDetails(
                matchId,
                platformId as RiotPlatformId | undefined
              );
            } catch (error) {
              console.error(`Failed to fetch match ${matchId}:`, error);
              throw error;
            }
          })
        );
      } catch (error) {
        // If match history fetch fails, wrap and return error
        const errorResponse = {
          success: false,
          error: {
            message: error instanceof Error ? error.message : 'Failed to fetch match history',
            code: 'MATCH_HISTORY_FETCH_ERROR',
            statusCode: error instanceof Error && error.message.includes('404') ? 404 : 500,
            details: {
              puuid,
              platformId,
              count: count || 20,
            },
            timestamp: new Date().toISOString(),
          }
        };
        
        // Log the full error response
        console.error('Error response from processMatches (match history fetch error):', JSON.stringify(errorResponse, null, 2));
        
        return errorResponse;
      }
    }
    
    if (matchesToProcess.length === 0) {
      return {
        success: true,
        processed: 0,
        puuid,
        message: 'No matches to process',
      };
    }
    
    console.log(`Processing ${matchesToProcess.length} matches...`);
    
    // Process each match
    const results = await Promise.all(
      matchesToProcess.map(async (matchData: MatchDto) => {
        return await processMatch(matchData);
      })
    );
    
    const successCount = results.filter(r => r.success).length;
    const totalParticipants = results.reduce((sum, r) => sum + (r.participantsProcessed || 0), 0);
    
    // Aggregate player stats after processing matches
    console.log(`Aggregating player stats for puuid: ${puuid}...`);
    try {
      await aggregatePlayerStats(puuid, platformId);
    } catch (error) {
      console.error('Error aggregating player stats:', error);
      // Don't fail the entire operation if stats aggregation fails
    }
    
    return {
      success: true,
      processed: successCount,
      totalMatches: matchesToProcess.length,
      participantsProcessed: totalParticipants,
      puuid,
    };
  } catch (error) {
    // Wrap error in response body instead of throwing
    const errorResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'DATA_PROCESSOR_ERROR',
        statusCode: 500,
        details: {
          puuid: event.arguments?.puuid,
          matches: event.arguments?.matches ? 'provided' : 'not provided',
          matchIds: event.arguments?.matchIds ? event.arguments.matchIds.length : 0,
          count: event.arguments?.count,
          platformId: event.arguments?.platformId,
        },
        timestamp: new Date().toISOString(),
      }
    };
    
    // Log the full error response
    console.error('Error response from processMatches:', JSON.stringify(errorResponse, null, 2));
    
    return errorResponse;
  }
};

async function processMatch(matchData: MatchDto) {
  // MatchDto has structure: { metadata: { matchId }, info: { gameCreation, participants, ... } }
  const info: MatchInfoDto = matchData.info;
  const matchId = matchData.metadata?.matchId;
  const participants: ParticipantDto[] = info?.participants || [];
  const gameCreation = info?.gameCreation;
  const gameDuration = info?.gameDuration;
  
  if (!matchId || !gameCreation || !participants || participants.length === 0) {
    throw new Error('Invalid match data: missing required fields (matchId, gameCreation, or participants)');
  }
  
  // Store match in MatchCache (handle potential duplicates)
  try {
    await client.models.MatchCache.create({
      matchId,
      gameCreation,
      matchData: matchData, // Store full match data as JSON
      processedAt: Date.now(),
    });
  } catch (error: any) {
    // If match already exists, log and continue (idempotency)
    if (error?.message?.includes('already exists') || error?.message?.includes('duplicate')) {
      console.warn(`Match ${matchId} already exists in cache, skipping cache update`);
    } else {
      throw error;
    }
  }
  
  // Store each participant in MatchParticipantIndex
  let successCount = 0;
  let skippedCount = 0;
  
  for (const participant of participants) {
    // Skip null/undefined participants (can happen if Riot API returns sparse arrays)
    if (!participant) {
      console.warn(`Skipping null/undefined participant in match ${matchId}`);
      continue;
    }
    
    // Validate required fields
    if (!participant.puuid) {
      console.warn(`Skipping participant with missing puuid in match ${matchId}`);
      continue;
    }
    
    const kda = participant.deaths > 0 
      ? (participant.kills + participant.assists) / participant.deaths 
      : participant.kills + participant.assists;
    
    // Extract all required fields with proper fallbacks
    const participantData: any = {
      puuid: participant.puuid,
      matchId,
      gameCreation,
      win: participant.win,
      kills: participant.kills,
      deaths: participant.deaths,
      assists: participant.assists,
      kda,
      championId: participant.championId,
      championName: participant.championName,
      lane: participant.lane,
      role: participant.role,
      teamPosition: participant.teamPosition,
      queueId: info?.queueId,
      gameMode: info?.gameMode,
      // New fields for AI analysis and statistics
      totalDamageDealt: participant.totalDamageDealt,
      totalDamageDealtToChampions: participant.totalDamageDealtToChampions,
      totalMinionsKilled: participant.totalMinionsKilled,
      visionScore: participant.visionScore,
      goldEarned: participant.goldEarned,
      goldSpent: participant.goldSpent,
      timePlayed: participant.timePlayed,
      totalTimeSpentDead: participant.totalTimeSpentDead,
      teamId: participant.teamId,
      gameDuration: gameDuration, // Match-level data, same for all participants
      processedAt: Date.now(),
    };
    
    try {
      const result = await client.models.MatchParticipantIndex.create(participantData);
      if (result.data) {
        successCount++;
      } else if (result.errors) {
        // Check if it's a duplicate error
        const isDuplicate = result.errors.some(err => 
          err.message?.includes('already exists') || 
          err.message?.includes('duplicate')
        );
        if (isDuplicate) {
          console.warn(`Participant ${participant.puuid} in match ${matchId} already exists, skipping`);
          skippedCount++;
        } else {
          throw new Error(result.errors.map(e => e.message).join(', '));
        }
      }
    } catch (error: any) {
      // If participant already exists (composite key), log and continue (idempotency)
      if (error?.message?.includes('already exists') || error?.message?.includes('duplicate')) {
        console.warn(`Participant ${participant.puuid} in match ${matchId} already exists, skipping`);
        skippedCount++;
      } else {
        console.error(`Error creating participant record:`, {
          matchId,
          puuid: participant.puuid,
          error: error?.message || String(error)
        });
        throw error;
      }
    }
  }
  
  return { 
    matchId, 
    success: true, 
    participantsProcessed: successCount,
    participantsSkipped: skippedCount
  };
}

async function aggregatePlayerStats(puuid: string, platformId?: string) {
  try {
    // Fetch all match participants for this player
    const { data: participants, errors } = await client.models.MatchParticipantIndex.list({
      filter: { puuid: { eq: puuid } },
    });

    if (errors || !participants || participants.length === 0) {
      console.log(`No participants found for puuid: ${puuid}`);
      return;
    }

    console.log(`Aggregating stats from ${participants.length} matches for puuid: ${puuid}`);

    // Aggregate statistics
    let totalMatches = 0;
    let wins = 0;
    let losses = 0;
    let totalKills = 0;
    let totalDeaths = 0;
    let totalAssists = 0;
    let totalCS = 0;
    let totalDamage = 0;
    let totalVisionScore = 0;
    let totalGames = 0;

    const championStats: Record<string, {
      wins: number;
      losses: number;
      kills: number;
      deaths: number;
      assists: number;
      games: number;
    }> = {};

    const roleStats: Record<string, {
      wins: number;
      losses: number;
      games: number;
    }> = {};

    // Process each participant record
    for (const participant of participants) {
      // Skip null/undefined participants (can happen if GraphQL returns null items)
      if (!participant) {
        console.warn(`Skipping null/undefined participant record for puuid: ${puuid}`);
        continue;
      }
      
      if (!participant.matchId || !participant.gameCreation) continue;

      totalMatches++;
      totalGames++;

      if (participant.win === true) {
        wins++;
      } else if (participant.win === false) {
        losses++;
      }

      if (participant.kills != null) totalKills += participant.kills;
      if (participant.deaths != null) totalDeaths += participant.deaths;
      if (participant.assists != null) totalAssists += participant.assists;
      if (participant.totalMinionsKilled != null) totalCS += participant.totalMinionsKilled;
      if (participant.totalDamageDealtToChampions != null) totalDamage += participant.totalDamageDealtToChampions;
      if (participant.visionScore != null) totalVisionScore += participant.visionScore;

      // Champion stats
      if (participant.championId != null) {
        const champId = participant.championId.toString();
        if (!championStats[champId]) {
          championStats[champId] = { wins: 0, losses: 0, kills: 0, deaths: 0, assists: 0, games: 0 };
        }
        championStats[champId].games++;
        if (participant.win === true) championStats[champId].wins++;
        if (participant.win === false) championStats[champId].losses++;
        if (participant.kills != null) championStats[champId].kills += participant.kills;
        if (participant.deaths != null) championStats[champId].deaths += participant.deaths;
        if (participant.assists != null) championStats[champId].assists += participant.assists;
      }

      // Role stats
      const role = participant.teamPosition || participant.role || 'UNKNOWN';
      if (!roleStats[role]) {
        roleStats[role] = { wins: 0, losses: 0, games: 0 };
      }
      roleStats[role].games++;
      if (participant.win === true) roleStats[role].wins++;
      if (participant.win === false) roleStats[role].losses++;
    }

    // Calculate averages
    const avgKills = totalGames > 0 ? totalKills / totalGames : 0;
    const avgDeaths = totalGames > 0 ? totalDeaths / totalGames : 0;
    const avgAssists = totalGames > 0 ? totalAssists / totalGames : 0;
    const avgKDA = avgDeaths > 0 ? (avgKills + avgAssists) / avgDeaths : avgKills + avgAssists;
    const avgCS = totalGames > 0 ? totalCS / totalGames : 0;
    const avgDamage = totalGames > 0 ? totalDamage / totalGames : 0;
    const avgVisionScore = totalGames > 0 ? totalVisionScore / totalGames : 0;
    const winRate = totalMatches > 0 ? wins / totalMatches : 0;

    // Calculate KDA for each champion
    const championStatsWithKDA: Record<string, any> = {};
    for (const [champId, stats] of Object.entries(championStats)) {
      const champKDA = stats.deaths > 0 
        ? (stats.kills + stats.assists) / stats.deaths 
        : stats.kills + stats.assists;
      championStatsWithKDA[champId] = {
        ...stats,
        kda: champKDA,
      };
    }

    // Try to get Riot ID from account API (optional, don't fail if it doesn't work)
    let riotId: { gameName: string; tagLine: string } | undefined;
    try {
      const account = await riotClient.getAccountByPuuid(puuid);
      if (account && account.gameName && account.tagLine) {
        riotId = {
          gameName: account.gameName,
          tagLine: account.tagLine,
        };
      }
    } catch (error) {
      console.warn(`Could not fetch Riot ID for puuid ${puuid}:`, error);
      // Continue without Riot ID
    }

    // Get the most recent match timestamp
    const mostRecentMatch = participants
      .filter(p => p.gameCreation)
      .sort((a, b) => (b.gameCreation || 0) - (a.gameCreation || 0))[0];
    const lastMatchFetched = mostRecentMatch?.gameCreation || Date.now();

    // Create or update PlayerStat
    const playerStatData: any = {
      puuid,
      totalMatches,
      wins,
      losses,
      winRate,
      avgKDA: {
        kills: avgKills,
        deaths: avgDeaths,
        assists: avgAssists,
        ratio: avgKDA,
      },
      avgCS,
      avgDamage,
      avgVisionScore,
      championStats: championStatsWithKDA,
      roleStats,
      lastUpdated: Date.now(),
      lastMatchFetched,
    };

    if (riotId) {
      playerStatData.riotId = riotId;
    }

    try {
      // Try to get existing PlayerStat
      const { data: existingStat } = await client.models.PlayerStat.get({ puuid });
      
      if (existingStat) {
        // Update existing stat
        await client.models.PlayerStat.update({
          puuid,
          ...playerStatData,
        });
        console.log(`Updated PlayerStat for puuid: ${puuid}`);
      } else {
        // Create new stat
        await client.models.PlayerStat.create(playerStatData);
        console.log(`Created PlayerStat for puuid: ${puuid}`);
      }
    } catch (error: any) {
      // If update fails, try create (handles race conditions)
      if (error?.message?.includes('not found') || error?.message?.includes('does not exist')) {
        try {
          await client.models.PlayerStat.create(playerStatData);
          console.log(`Created PlayerStat for puuid: ${puuid} (after update failed)`);
        } catch (createError) {
          console.error(`Failed to create PlayerStat for puuid: ${puuid}`, createError);
          throw createError;
        }
      } else {
        console.error(`Failed to update PlayerStat for puuid: ${puuid}`, error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Error in aggregatePlayerStats:', error);
    throw error;
  }
}