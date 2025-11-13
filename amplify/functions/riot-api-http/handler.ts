import type { Handler } from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';
import { RiotRegion } from '../../types/riot/index';

if (!process.env.RIOT_API_KEY) {
  throw new Error('RIOT_API_KEY environment variable is required');
}

if (!process.env.MATCH_CACHE_BUCKET_NAME) {
  throw new Error('MATCH_CACHE_BUCKET_NAME environment variable is required');
}

const API_KEY = process.env.RIOT_API_KEY;
const BUCKET_NAME = process.env.MATCH_CACHE_BUCKET_NAME;
const s3Client = new S3Client({});

// Initialize Amplify client for DynamoDB access
// Note: In Lambda, Amplify Gen 2 automatically configures the client when function is used as handler
// We use apiKey auth mode as Amplify provides the API key via environment variables
// Try to configure Amplify with outputs if available (for local development)
// In deployed Lambda, Amplify auto-configures via environment variables
try {
  const outputs = require('../../../amplify_outputs.json');
  Amplify.configure(outputs);
} catch (error) {
  // If outputs not available (e.g., in deployed Lambda), Amplify will use env vars
  console.log('amplify_outputs.json not found, using environment variables for Amplify configuration');
}

const getClient = () => generateClient<Schema>({ authMode: 'apiKey' });


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
 * Calculate TTL timestamp (1 day from now in seconds)
 */
function getTTLTimestamp(): number {
  const now = Date.now();
  const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
  const ttlTimestamp = now + oneDayInMilliseconds;
  return Math.floor(ttlTimestamp / 1000);
}

/**
 * Validate if match data is valid (not null/empty/undefined)
 */
function isValidMatchData(data: any): boolean {
  if (data == null) return false;
  if (typeof data !== 'object') return false;
  if (Object.keys(data).length === 0) return false;
  // Check for required Riot API match structure
  if (!data.metadata?.matchId && !data.info) return false;
  return true;
}

/**
 * Get match data from DynamoDB MatchCache
 */
async function getMatchFromDynamoDB(matchId: string): Promise<any | null> {
  try {
    const client = getClient();
    const { data, errors } = await client.models.MatchCache.get({ matchId });
    
    if (errors) {
      console.warn(`Error reading match ${matchId} from DynamoDB:`, errors);
      return null;
    }
    
    if (!data) {
      return null;
    }
    
    // Parse matchData if it's a string
    let matchData = data.matchData;
    if (typeof matchData === 'string') {
      try {
        matchData = JSON.parse(matchData);
      } catch (e) {
        console.warn(`Failed to parse matchData for ${matchId}:`, e);
        return null;
      }
    }
    
    // Validate the match data
    if (!isValidMatchData(matchData)) {
      console.log(`Match ${matchId} in DynamoDB has invalid/empty matchData`);
      return null;
    }
    
    return matchData;
  } catch (error: any) {
    console.warn(`Error reading match ${matchId} from DynamoDB:`, error);
    return null;
  }
}

/**
 * Store match data in DynamoDB MatchCache
 */
async function storeMatchInDynamoDB(matchId: string, matchData: any, gameCreation?: number): Promise<void> {
  try {
    const client = getClient();
    const ttl = getTTLTimestamp();
    
    // Extract gameCreation from matchData if not provided
    const gameCreationTime = gameCreation || matchData?.info?.gameCreation || Date.now();
    
    await client.models.MatchCache.create({
      matchId,
      gameCreation: gameCreationTime,
      matchData: matchData,
      ttl,
      processedAt: Date.now(),
    });
  } catch (error: any) {
    // If it's a duplicate, try to update instead
    if (error?.message?.includes('already exists') || error?.message?.includes('duplicate')) {
      try {
        const client = getClient();
        const ttl = getTTLTimestamp();
        await client.models.MatchCache.update({
          matchId,
          matchData: matchData,
          ttl,
        });
      } catch (updateError) {
        console.warn(`Error updating match ${matchId} in DynamoDB:`, updateError);
        // Don't throw - caching failure shouldn't break the API call
      }
    } else {
      console.warn(`Error storing match ${matchId} in DynamoDB:`, error);
      // Don't throw - caching failure shouldn't break the API call
    }
  }
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
    
    // fetchMatchIds arguments
    puuid?: string;
    count?: number;
    start?: number;
    
    // getMatchDetails arguments
    matchId?: string;
    
    // Shared arguments
    region?: string; // Used by searchPlayer, fetchMatchIds, getMatchDetails, getMatchTimeline, getAccountByPuuid
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
      const region = args.region || RiotRegion.AMERICAS;
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
      // Check DynamoDB first (primary source)
      const dynamoMatch = await getMatchFromDynamoDB(args.matchId);
      if (dynamoMatch) {
        console.log(`DynamoDB hit for match ${args.matchId}`);
        return dynamoMatch;
      }

      // Check S3 cache second (cache layer)
      const cachedMatch = await getCachedMatch(args.matchId);
      if (cachedMatch && isValidMatchData(cachedMatch)) {
        console.log(`S3 cache hit for match ${args.matchId}`);
        // Store in DynamoDB for future use (fire and forget)
        storeMatchInDynamoDB(args.matchId, cachedMatch, cachedMatch?.info?.gameCreation).catch(err =>
          console.warn(`Failed to store match ${args.matchId} in DynamoDB:`, err)
        );
        return cachedMatch;
      }

      // Cache miss - fetch from Riot API
      console.log(`Cache miss for match ${args.matchId}, fetching from Riot API`);
      const region = args.region || RiotRegion.AMERICAS;
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
      
      // Validate the fetched data
      if (!isValidMatchData(matchData)) {
        throw new Error('Invalid match data received from Riot API');
      }
      
      // Store in both DynamoDB and S3 (fire and forget)
      storeMatchInDynamoDB(args.matchId, matchData, matchData?.info?.gameCreation).catch(err => 
        console.warn(`Failed to store match ${args.matchId} in DynamoDB:`, err)
      );
      cacheMatch(args.matchId, matchData).catch(err => 
        console.warn(`Failed to cache match ${args.matchId} in S3:`, err)
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
      const region = args.region || RiotRegion.AMERICAS;
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

