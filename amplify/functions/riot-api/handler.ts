import type { Handler } from 'aws-lambda';
import { RiotApiClient } from './riot-api-client';
import { RiotRegion, RiotPlatformId } from '../../../types/riot';

const riotClient = new RiotApiClient({
  apiKey: process.env.RIOT_API_KEY!,
});

/**
 * Amplify Gen 2 GraphQL Query Handler
 * 
 * Handles two queries:
 * - searchPlayer: Get account by Riot ID (gameName + tagLine)
 * - fetchMatches: Get match history by PUUID
 */
interface GraphQLQueryEvent {
  arguments: {
    // searchPlayer query arguments
    gameName?: string;
    tagLine?: string;
    region?: RiotRegion;
    
    // fetchMatches query arguments
    puuid?: string;
    count?: number;
    platformId?: RiotPlatformId;
    
    [key: string]: any;
  };
  identity?: any;
  source?: any;
  request?: any;
  prev?: any;
  info?: any;
}

export const handler: Handler<GraphQLQueryEvent, any> = async (event) => {
  try {
    const args = event.arguments;
    
    // Handle searchPlayer query
    if (args.gameName && args.tagLine) {
      const account = await riotClient.getAccountByRiotId(
        args.gameName,
        args.tagLine,
        args.region
      );
      // Return account data including puuid
      return account;
    }
    
    // Handle fetchMatches query
    if (args.puuid) {
      const matches = await riotClient.getMatchHistory({
        puuid: args.puuid,
        platformId: args.platformId,
        count: args.count || 20,
        start: 0, // Always start from the beginning
      });
      return matches;
    }
    
    throw new Error('Invalid query arguments: Must provide either (gameName, tagLine) or (puuid)');
  } catch (error) {
    console.error('Riot API error:', error);
    // Throw error to let Amplify Gen 2 handle it properly
    throw error;
  }
};