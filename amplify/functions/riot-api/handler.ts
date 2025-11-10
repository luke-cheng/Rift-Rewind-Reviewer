import type { APIGatewayProxyHandler } from 'aws-lambda';
import { RiotApiClient } from '../../../lib/riot-api-client';
import { RiotRegion, RiotPlatformId } from '../../../types/riot';

const riotClient = new RiotApiClient({
  apiKey: process.env.RIOT_API_KEY!,
});

export const handler: APIGatewayProxyHandler = async (event) => {
  const { httpMethod, path, queryStringParameters, body } = event;
  
  try {
    if (httpMethod === 'GET' && path.includes('/account/')) {
      const { gameName, tagLine, region } = queryStringParameters || {};
      if (!gameName || !tagLine) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing gameName or tagLine' }) };
      }
      
      const account = await riotClient.getAccountByRiotId(
        gameName, 
        tagLine, 
        region as RiotRegion
      );
      return { statusCode: 200, body: JSON.stringify(account) };
    }
    
    if (httpMethod === 'GET' && path.includes('/matches/')) {
      const { puuid, platformId, count = '20', start = '0' } = queryStringParameters || {};
      if (!puuid) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing puuid' }) };
      }
      
      const matches = await riotClient.getMatchHistory({
        puuid,
        platformId: platformId as RiotPlatformId,
        count: parseInt(count),
        start: parseInt(start),
      });
      return { statusCode: 200, body: JSON.stringify(matches) };
    }
    
    if (httpMethod === 'GET' && path.includes('/match/')) {
      const { matchId, platformId } = queryStringParameters || {};
      if (!matchId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing matchId' }) };
      }
      
      const match = await riotClient.getMatchDetails(matchId, platformId as RiotPlatformId);
      return { statusCode: 200, body: JSON.stringify(match) };
    }
    
    return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };
  } catch (error) {
    console.error('Riot API error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Internal server error' }) 
    };
  }
};