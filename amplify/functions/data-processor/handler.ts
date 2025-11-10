import type { APIGatewayProxyHandler } from 'aws-lambda';

// GraphQL API endpoint and API key are injected as environment variables
// These should be configured in the function resource or through Amplify's automatic injection
// when the function is granted access to the data resource
const GRAPHQL_ENDPOINT = process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT || process.env.GRAPHQL_ENDPOINT;
const API_KEY = process.env.AMPLIFY_DATA_API_KEY || process.env.API_KEY;

// Helper function to execute GraphQL mutations/queries
async function executeGraphQL(query: string, variables: Record<string, any>): Promise<any> {
  if (!GRAPHQL_ENDPOINT) {
    throw new Error('GraphQL endpoint not configured. Set AMPLIFY_DATA_GRAPHQL_ENDPOINT environment variable.');
  }

  // Prepare headers - use API key if available, otherwise rely on IAM authentication
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // If API key is available, use it for authentication
  // Otherwise, rely on IAM role permissions (requires proper IAM setup)
  if (API_KEY) {
    headers['x-api-key'] = API_KEY;
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GraphQL request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const { body } = event;
  
  try {
    const { action, data } = JSON.parse(body || '{}');
    
    switch (action) {
      case 'processMatch':
        return await processMatch(data);
      case 'updatePlayerStats':
        return await updatePlayerStats(data);
      case 'cacheMatch':
        return await cacheMatch(data);
      default:
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action' }) };
    }
  } catch (error) {
    console.error('Data processor error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Processing failed', details: error instanceof Error ? error.message : String(error) }) 
    };
  }
};

async function processMatch(matchData: any) {
  const { matchId, gameCreation, participants } = matchData;
  
  // Create match cache using GraphQL mutation
  const createMatchCacheMutation = `
    mutation CreateMatchCache($input: CreateMatchCacheInput!) {
      createMatchCache(input: $input) {
        matchId
      }
    }
  `;
  
  await executeGraphQL(createMatchCacheMutation, {
    input: {
    matchId,
    gameCreation,
      matchData: matchData, // JSON fields store objects directly
    processedAt: Date.now(),
    },
  });
  
  // Create participant index entries using GraphQL mutations
  const createParticipantIndexMutation = `
    mutation CreateMatchParticipantIndex($input: CreateMatchParticipantIndexInput!) {
      createMatchParticipantIndex(input: $input) {
        id
      }
    }
  `;
  
  for (const participant of participants) {
    const kda = participant.deaths > 0 
      ? (participant.kills + participant.assists) / participant.deaths 
      : participant.kills + participant.assists;
    
    await executeGraphQL(createParticipantIndexMutation, {
      input: {
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
      teamPosition: participant.teamPosition,
      processedAt: Date.now(),
      },
    });
  }
  
  return { statusCode: 200, body: JSON.stringify({ success: true }) };
}

async function updatePlayerStats(playerData: any) {
  const { puuid, stats } = playerData;
  
  // Update player stats using GraphQL mutation
  const updatePlayerStatMutation = `
    mutation UpdatePlayerStat($input: UpdatePlayerStatInput!) {
      updatePlayerStat(input: $input) {
        puuid
      }
    }
  `;
  
  await executeGraphQL(updatePlayerStatMutation, {
    input: {
    puuid,
    ...stats,
    lastUpdated: Date.now(),
    },
  });
  
  return { statusCode: 200, body: JSON.stringify({ success: true }) };
}

async function cacheMatch(matchData: any) {
  const { matchId, gameCreation, data } = matchData;
  
  // Create match cache using GraphQL mutation
  const createMatchCacheMutation = `
    mutation CreateMatchCache($input: CreateMatchCacheInput!) {
      createMatchCache(input: $input) {
        matchId
      }
    }
  `;
  
  // Store JSON object directly without stringification
  await executeGraphQL(createMatchCacheMutation, {
    input: {
    matchId,
    gameCreation,
      matchData: data, // JSON fields store objects directly
    processedAt: Date.now(),
    expiresAt: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days TTL
    },
  });
  
  return { statusCode: 200, body: JSON.stringify({ success: true }) };
}