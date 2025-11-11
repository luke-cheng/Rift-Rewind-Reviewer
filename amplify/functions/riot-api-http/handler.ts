import type { Handler } from 'aws-lambda';
import { RiotRegion, RiotPlatformId } from '../../types/riot/index';

if (!process.env.RIOT_API_KEY) {
  throw new Error('RIOT_API_KEY environment variable is required');
}

const API_KEY = process.env.RIOT_API_KEY;

/**
 * Maps platform ID to region
 */
function getRegionFromPlatform(platformId: string): RiotRegion {
  const platformToRegion: Record<string, RiotRegion> = {
    'br1': RiotRegion.AMERICAS,
    'la1': RiotRegion.AMERICAS,
    'la2': RiotRegion.AMERICAS,
    'na1': RiotRegion.AMERICAS,
    'oc1': RiotRegion.AMERICAS,
    'jp1': RiotRegion.ASIA,
    'kr': RiotRegion.ASIA,
    'ph2': RiotRegion.ASIA,
    'sg2': RiotRegion.ASIA,
    'th2': RiotRegion.ASIA,
    'tw2': RiotRegion.ASIA,
    'vn2': RiotRegion.ASIA,
    'eun1': RiotRegion.EUROPE,
    'euw1': RiotRegion.EUROPE,
    'ru': RiotRegion.EUROPE,
    'tr1': RiotRegion.EUROPE,
  };
  return platformToRegion[platformId] || RiotRegion.AMERICAS;
}

/**
 * Calculate Unix timestamp (in seconds) for 365 days ago
 */
function get365DaysAgoTimestamp(): number {
  const now = Date.now();
  const daysInMilliseconds = 365 * 24 * 60 * 60 * 1000;
  const timestamp365DaysAgo = now - daysInMilliseconds;
  return Math.floor(timestamp365DaysAgo / 1000);
}

/**
 * GraphQL Resolver Event for HTTP datasource queries
 */
interface GraphQLResolverEvent {
  arguments: {
    // searchPlayer arguments
    gameName?: string;
    tagLine?: string;
    region?: string;
    
    // fetchMatchIds arguments
    puuid?: string;
    count?: number;
    platformId?: string;
    start?: number;
    
    // getMatchDetails arguments
    matchId?: string;
    
    // getMatchTimeline arguments (uses matchId and platformId)
    
    
  };
  info: {
    fieldName: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export const handler: Handler<GraphQLResolverEvent, any> = async (event) => {
  try {
    // Log the event structure for debugging
    console.log('Handler received event:', JSON.stringify(event, null, 2));
    
    // Handle different event structures (Amplify Gen 2 might pass events differently)
    const args = event.arguments || {};
    const info = event.info || {};
    const fieldName = info.fieldName || event.fieldName;
    
    console.log('Field name:', fieldName);
    console.log('Arguments:', JSON.stringify(args, null, 2));
    
    // If no field name, throw error
    if (!fieldName) {
      console.error('No field name found in event');
      throw new Error('No field name found in GraphQL event');
    }

    // Handle searchPlayer query
    if (fieldName === 'searchPlayer' && args?.gameName && args?.tagLine) {
      const region = args.region || 'americas';
      const url = `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(args.gameName)}/${encodeURIComponent(args.tagLine)}`;
      
      const response = await fetch(url, {
        headers: {
          'X-Riot-Token': API_KEY,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = response.status === 404 
          ? 'Player not found' 
          : `Riot API error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      return await response.json();
    }

    // Handle fetchMatchIds query
    if (fieldName === 'fetchMatchIds' && args.puuid) {
      const platformId = args.platformId || 'na1';
      const region = getRegionFromPlatform(platformId);
      const count = args.count || 20;
      const start = args.start || 0;
      const startTime = get365DaysAgoTimestamp();
      
      const url = new URL(`https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${args.puuid}/ids`);
      url.searchParams.set('start', start.toString());
      url.searchParams.set('count', count.toString());
      url.searchParams.set('startTime', startTime.toString());
      
      const response = await fetch(url.toString(), {
        headers: {
          'X-Riot-Token': API_KEY,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = response.status === 404 
          ? 'Matches not found' 
          : `Riot API error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      return await response.json();
    }

    // Handle getMatchDetails query
    if (fieldName === 'getMatchDetails' && args.matchId) {
      const platformId = args.platformId || 'na1';
      const region = getRegionFromPlatform(platformId);
      const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/${args.matchId}`;
      
      const response = await fetch(url, {
        headers: {
          'X-Riot-Token': API_KEY,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = response.status === 404 
          ? 'Match not found' 
          : `Riot API error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      return await response.json();
    }

    // Handle getMatchTimeline query
    if (fieldName === 'getMatchTimeline' && args.matchId) {
      const platformId = args.platformId || 'na1';
      const region = getRegionFromPlatform(platformId);
      const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/${args.matchId}/timeline`;
      
      const response = await fetch(url, {
        headers: {
          'X-Riot-Token': API_KEY,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = response.status === 404 
          ? 'Timeline not found' 
          : `Riot API error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      return await response.json();
    }

    // Handle getAccountByPuuid query
    if (fieldName === 'getAccountByPuuid' && args.puuid) {
      const region = args.region || 'americas';
      const url = `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${args.puuid}`;
      
      const response = await fetch(url, {
        headers: {
          'X-Riot-Token': API_KEY,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = response.status === 404 
          ? 'Account not found' 
          : `Riot API error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      return await response.json();
    }

    throw new Error(`Unknown field: ${fieldName}`);
  } catch (error) {
    console.error('Handler error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
};

