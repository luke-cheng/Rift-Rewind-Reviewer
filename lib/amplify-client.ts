import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

export const amplifyClient = generateClient<Schema>();

// Helper functions for common operations
export async function getPlayerMatches(puuid: string, limit = 20) {
  const { data } = await amplifyClient.models.MatchParticipantIndex.list({
    filter: { puuid: { eq: puuid } },
    limit,
  });
  return data;
}

export async function getMatchDetails(matchId: string) {
  const { data } = await amplifyClient.models.MatchCache.get({ matchId });
  return data;
}

export async function getPlayerStats(puuid: string) {
  const { data } = await amplifyClient.models.PlayerStat.get({ puuid });
  return data;
}