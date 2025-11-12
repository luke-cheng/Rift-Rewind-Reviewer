import type { Handler } from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { RiotRegion, RiotPlatformId } from '../../types/riot/index';

if (!process.env.RIOT_API_KEY) {
  throw new Error('RIOT_API_KEY environment variable is required');
}

if (!process.env.MATCH_CACHE_BUCKET_NAME) {
  throw new Error('MATCH_CACHE_BUCKET_NAME environment variable is required');
}

const API_KEY = process.env.RIOT_API_KEY;
const BUCKET_NAME = process.env.MATCH_CACHE_BUCKET_NAME;
const s3Client = new S3Client({});

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
 * Get cached match data from S3
 */
async function getCachedMatch(matchId: string): Promise<any | null> {
  try {
    const key = `matches/${matchId}.json`;
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    const response = await s3Client.send(command);
    if (response.Body) {
      const bodyString = await response.Body.transformToString();
      return JSON.parse(bodyString);
    }
    return null;
  } catch (error: any) {
    // If object doesn't exist, return null (not an error)
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return null;
    }
    console.warn(`Error reading cached match ${matchId}:`, error);
    return null;
  }
}

/**
 * Get cached timeline data from S3
 */
async function getCachedTimeline(matchId: string): Promise<any | null> {
  try {
    const key = `timelines/${matchId}.json`;
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    const response = await s3Client.send(command);
    if (response.Body) {
      const bodyString = await response.Body.transformToString();
      return JSON.parse(bodyString);
    }
    return null;
  } catch (error: any) {
    // If object doesn't exist, return null (not an error)
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return null;
    }
    console.warn(`Error reading cached timeline ${matchId}:`, error);
    return null;
  }
}

/**
 * Cache match data to S3 with 1-year expiration metadata
 */
async function cacheMatch(matchId: string, data: any): Promise<void> {
  try {
    const key = `matches/${matchId}.json`;
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: 'application/json',
      Metadata: {
        'expires-at': expiresAt.toISOString(),
        'cached-at': new Date().toISOString(),
      },
    });
    await s3Client.send(command);
  } catch (error) {
    console.warn(`Error caching match ${matchId}:`, error);
    // Don't throw - caching failure shouldn't break the API call
  }
}

/**
 * Cache timeline data to S3 with 1-year expiration metadata
 */
async function cacheTimeline(matchId: string, data: any): Promise<void> {
  try {
    const key = `timelines/${matchId}.json`;
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: 'application/json',
      Metadata: {
        'expires-at': expiresAt.toISOString(),
        'cached-at': new Date().toISOString(),
      },
    });
    await s3Client.send(command);
  } catch (error) {
    console.warn(`Error caching timeline ${matchId}:`, error);
    // Don't throw - caching failure shouldn't break the API call
  }
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
      // Check S3 cache first
      const cachedMatch = await getCachedMatch(args.matchId);
      if (cachedMatch) {
        console.log(`Cache hit for match ${args.matchId}`);
        return cachedMatch;
      }

      // Cache miss - fetch from Riot API
      console.log(`Cache miss for match ${args.matchId}, fetching from API`);
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

      const matchData = await response.json();
      
      // Cache the response (fire and forget)
      cacheMatch(args.matchId, matchData).catch(err => 
        console.warn(`Failed to cache match ${args.matchId}:`, err)
      );

      return matchData;
    }

    // Handle getMatchTimeline query
    if (fieldName === 'getMatchTimeline' && args.matchId) {
      // Check S3 cache first
      const cachedTimeline = await getCachedTimeline(args.matchId);
      if (cachedTimeline) {
        console.log(`Cache hit for timeline ${args.matchId}`);
        return cachedTimeline;
      }

      // Cache miss - fetch from Riot API
      console.log(`Cache miss for timeline ${args.matchId}, fetching from API`);
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

      const timelineData = await response.json();
      
      // Cache the response (fire and forget)
      cacheTimeline(args.matchId, timelineData).catch(err => 
        console.warn(`Failed to cache timeline ${args.matchId}:`, err)
      );

      return timelineData;
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

