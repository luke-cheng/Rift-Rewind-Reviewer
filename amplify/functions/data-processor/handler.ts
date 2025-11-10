import type { Handler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';

Amplify.configure({
  API: {
    GraphQL: {
      endpoint: process.env.DATA_GRAPHQL_ENDPOINT!,
      region: process.env.AWS_REGION!,
      defaultAuthMode: 'apiKey'
    }
  }
});

const client = generateClient<Schema>();

/**
 * Amplify Gen 2 GraphQL Mutation Handler
 * 
 * Handles processMatches mutation:
 * - Processes match data and stores in MatchCache and MatchParticipantIndex
 */
interface GraphQLMutationEvent {
  arguments: {
    puuid: string;
    matches: any; // Array of match data
  };
  identity?: any;
  source?: any;
  request?: any;
  prev?: any;
  info?: any;
}

export const handler: Handler<GraphQLMutationEvent, any> = async (event) => {
  try {
    const { puuid, matches } = event.arguments;
    
    if (!puuid || !matches) {
      throw new Error('Missing required arguments: puuid and matches');
    }
    
    // Process each match
    const results = await Promise.all(
      matches.map(async (matchData: any) => {
        return await processMatch(matchData);
      })
    );
    
    return {
      success: true,
      processed: results.length,
      puuid,
    };
  } catch (error) {
    console.error('Data processor error:', error);
    // Throw error to let Amplify Gen 2 handle it properly
    throw error;
  }
};

async function processMatch(matchData: any) {
  const { matchId, gameCreation, participants, info } = matchData;
  
  if (!matchId || !gameCreation || !participants) {
    throw new Error('Invalid match data: missing required fields');
  }
  
  // Store match in MatchCache
  await client.models.MatchCache.create({
    matchId,
    gameCreation,
    matchData: matchData, // Store full match data as JSON
    processedAt: Date.now(),
  });
  
  // Store each participant in MatchParticipantIndex
  const participantPromises = participants.map(async (participant: any) => {
    const kda = participant.deaths > 0 
      ? (participant.kills + participant.assists) / participant.deaths 
      : participant.kills + participant.assists;
    
    return client.models.MatchParticipantIndex.create({
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
      processedAt: Date.now(),
    });
  });
  
  await Promise.all(participantPromises);
  
  return { matchId, success: true };
}