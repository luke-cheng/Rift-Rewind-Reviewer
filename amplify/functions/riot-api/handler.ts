import type { Handler } from 'aws-lambda';
import { RiotApiClient } from './riot-api-client';
import { RiotRegion, RiotPlatformId } from '../../types/riot/index';

if (!process.env.RIOT_API_KEY) {
  throw new Error('RIOT_API_KEY environment variable is required');
}

const riotClient = new RiotApiClient({
  apiKey: process.env.RIOT_API_KEY,
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
      try {
        const account = await riotClient.getAccountByRiotId(
          args.gameName,
          args.tagLine,
          args.region
        );
        // Return account data including puuid
        return account;
      } catch (error) {
        // Wrap error in response body
        const errorResponse = {
          success: false,
          error: {
            message: error instanceof Error ? error.message : String(error),
            code: error instanceof Error && error.message.includes('404') ? 'PLAYER_NOT_FOUND' : 'RIOT_API_ERROR',
            statusCode: error instanceof Error && error.message.includes('404') ? 404 : 500,
            details: {
              gameName: args.gameName,
              tagLine: args.tagLine,
              region: args.region,
            },
            timestamp: new Date().toISOString(),
          }
        };
        
        // Log the full error response
        console.error('Error response from searchPlayer:', JSON.stringify(errorResponse, null, 2));
        
        return errorResponse;
      }
    }
    
    // Handle fetchMatches query
    if (args.puuid) {
      try {
        const matches = await riotClient.getMatchHistory({
          puuid: args.puuid,
          platformId: args.platformId,
          count: args.count || 20,
          start: 0, // Always start from the beginning
        });
        return matches;
      } catch (error) {
        // Wrap error in response body
        const errorResponse = {
          success: false,
          error: {
            message: error instanceof Error ? error.message : String(error),
            code: 'RIOT_API_ERROR',
            statusCode: error instanceof Error && error.message.includes('404') ? 404 : 500,
            details: {
              puuid: args.puuid,
              platformId: args.platformId,
            },
            timestamp: new Date().toISOString(),
          }
        };
        
        // Log the full error response
        console.error('Error response from fetchMatches:', JSON.stringify(errorResponse, null, 2));
        
        return errorResponse;
      }
    }
    
    // Invalid arguments - wrap in error response
    const invalidArgsError = {
      success: false,
      error: {
        message: 'Invalid query arguments: Must provide either (gameName, tagLine) or (puuid)',
        code: 'INVALID_ARGUMENTS',
        statusCode: 400,
        details: {
          receivedArgs: Object.keys(args),
        },
        timestamp: new Date().toISOString(),
      }
    };
    
    // Log the full error response
    console.error('Error response from handler (invalid arguments):', JSON.stringify(invalidArgsError, null, 2));
    
    return invalidArgsError;
  } catch (error) {
    // Catch-all for unexpected errors - wrap in response body
    const errorResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'UNKNOWN_ERROR',
        statusCode: 500,
        details: {
          args: event.arguments,
        },
        timestamp: new Date().toISOString(),
      }
    };
    
    // Log the full error response
    console.error('Error response from handler (unexpected error):', JSON.stringify(errorResponse, null, 2));
    
    return errorResponse;
  }
};