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
      throw new Error('Missing required argument: puuid');
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
      console.log(`Fetching match history for puuid: ${puuid}...`);
      const matchIdsList = await riotClient.getMatchHistory({
        puuid,
        platformId: platformId as RiotPlatformId | undefined,
        count: count || 20,
        start: 0,
      });
      
      if (!matchIdsList || matchIdsList.length === 0) {
        return {
          success: true,
          processed: 0,
          puuid,
          message: 'No matches found for this player',
        };
      }
      
      console.log(`Found ${matchIdsList.length} matches, fetching details...`);
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
    
    return {
      success: true,
      processed: successCount,
      totalMatches: matchesToProcess.length,
      participantsProcessed: totalParticipants,
      puuid,
    };
  } catch (error) {
    console.error('Data processor error:', {
      message: error instanceof Error ? error.message : String(error),
      puuid: event.arguments?.puuid,
      timestamp: new Date().toISOString()
    });
    
    throw new Error(`Failed to process matches: ${error instanceof Error ? error.message : 'Unknown error'}`);
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