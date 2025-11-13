import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';
import type { MatchDto, ParticipantDto, MatchInfoDto } from '../../types/riot/match-v5';
import outputs from "../../../amplify_outputs.json";

Amplify.configure(outputs);

// Initialize client
const getClient = () => generateClient<Schema>({ authMode: 'apiKey' });

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
 * Pure function: Process match data and return structures for storage
 * No side effects - just transforms data
 */
export function processMatchData(matchData: MatchDto): {
  matchCacheData: {
    matchId: string;
    gameCreation: number;
    matchData: MatchDto;
    processedAt: number;
  };
  participantData: Array<{
    puuid: string;
    matchId: string;
    gameCreation: number;
    win: boolean | null;
    kills: number | null;
    deaths: number | null;
    assists: number | null;
    kda: number;
    championId: number | null;
    championName: string | null;
    lane: string | null;
    role: string | null;
    teamPosition: string | null;
    queueId: number | null;
    gameMode: string | null;
    totalDamageDealt: number | null;
    totalDamageDealtToChampions: number | null;
    totalMinionsKilled: number | null;
    visionScore: number | null;
    goldEarned: number | null;
    goldSpent: number | null;
    timePlayed: number | null;
    totalTimeSpentDead: number | null;
    teamId: number | null;
    gameDuration: number | null;
    processedAt: number;
  }>;
} {
  const info: MatchInfoDto = matchData.info;
  const matchId = matchData.metadata?.matchId;
  const participants: ParticipantDto[] = info?.participants || [];
  const gameCreation = info?.gameCreation;
  const gameDuration = info?.gameDuration;

  if (!matchId || !gameCreation || !participants || participants.length === 0) {
    throw new Error('Invalid match data: missing required fields (matchId, gameCreation, or participants)');
  }

  const matchCacheData = {
    matchId,
    gameCreation,
    matchData: matchData,
    processedAt: Date.now(),
  };

  const participantData = participants
    .filter(participant => participant && participant.puuid)
    .map(participant => {
      const kda = participant.deaths > 0
        ? (participant.kills + participant.assists) / participant.deaths
        : participant.kills + participant.assists;

      return {
        puuid: participant.puuid,
        matchId,
        gameCreation,
        win: participant.win ?? null,
        kills: participant.kills ?? null,
        deaths: participant.deaths ?? null,
        assists: participant.assists ?? null,
        kda,
        championId: participant.championId ?? null,
        championName: participant.championName ?? null,
        lane: participant.lane ?? null,
        role: participant.role ?? null,
        teamPosition: participant.teamPosition ?? null,
        queueId: info?.queueId ?? null,
        gameMode: info?.gameMode ?? null,
        totalDamageDealt: participant.totalDamageDealt ?? null,
        totalDamageDealtToChampions: participant.totalDamageDealtToChampions ?? null,
        totalMinionsKilled: participant.totalMinionsKilled ?? null,
        visionScore: participant.visionScore ?? null,
        goldEarned: participant.goldEarned ?? null,
        goldSpent: participant.goldSpent ?? null,
        timePlayed: participant.timePlayed ?? null,
        totalTimeSpentDead: participant.totalTimeSpentDead ?? null,
        teamId: participant.teamId ?? null,
        gameDuration: gameDuration ?? null,
        processedAt: Date.now(),
      };
    });

  return {
    matchCacheData,
    participantData,
  };
}

/**
 * Pure function: Aggregate player stats from participant records
 * No side effects - just calculates statistics
 */
export function aggregateStatsForPlayer(participants: Array<{
  matchId: string | null;
  gameCreation: number | null;
  win: boolean | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  totalMinionsKilled: number | null;
  totalDamageDealtToChampions: number | null;
  visionScore: number | null;
  championId: number | null;
  teamPosition: string | null;
  role: string | null;
}>): {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKDA: {
    kills: number;
    deaths: number;
    assists: number;
    ratio: number;
  };
  avgCS: number;
  avgDamage: number;
  avgVisionScore: number;
  championStats: Record<string, any>;
  roleStats: Record<string, any>;
  lastMatchFetched: number;
} {
  let totalMatches = 0;
  let wins = 0;
  let losses = 0;
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalCS = 0;
  let totalDamage = 0;
  let totalVisionScore = 0;
  let totalGames = 0;

  const championStats: Record<string, {
    wins: number;
    losses: number;
    kills: number;
    deaths: number;
    assists: number;
    games: number;
  }> = {};

  const roleStats: Record<string, {
    wins: number;
    losses: number;
    games: number;
  }> = {};

  // Process each participant record
  for (const participant of participants) {
    if (!participant.matchId || !participant.gameCreation) continue;

    totalMatches++;
    totalGames++;

    if (participant.win === true) {
      wins++;
    } else if (participant.win === false) {
      losses++;
    }

    if (participant.kills != null) totalKills += participant.kills;
    if (participant.deaths != null) totalDeaths += participant.deaths;
    if (participant.assists != null) totalAssists += participant.assists;
    if (participant.totalMinionsKilled != null) totalCS += participant.totalMinionsKilled;
    if (participant.totalDamageDealtToChampions != null) totalDamage += participant.totalDamageDealtToChampions;
    if (participant.visionScore != null) totalVisionScore += participant.visionScore;

    // Champion stats
    if (participant.championId != null) {
      const champId = participant.championId.toString();
      if (!championStats[champId]) {
        championStats[champId] = { wins: 0, losses: 0, kills: 0, deaths: 0, assists: 0, games: 0 };
      }
      championStats[champId].games++;
      if (participant.win === true) championStats[champId].wins++;
      if (participant.win === false) championStats[champId].losses++;
      if (participant.kills != null) championStats[champId].kills += participant.kills;
      if (participant.deaths != null) championStats[champId].deaths += participant.deaths;
      if (participant.assists != null) championStats[champId].assists += participant.assists;
    }

    // Role stats
    const role = participant.teamPosition || participant.role || 'UNKNOWN';
    if (!roleStats[role]) {
      roleStats[role] = { wins: 0, losses: 0, games: 0 };
    }
    roleStats[role].games++;
    if (participant.win === true) roleStats[role].wins++;
    if (participant.win === false) roleStats[role].losses++;
  }

  // Calculate averages
  const avgKills = totalGames > 0 ? totalKills / totalGames : 0;
  const avgDeaths = totalGames > 0 ? totalDeaths / totalGames : 0;
  const avgAssists = totalGames > 0 ? totalAssists / totalGames : 0;
  const avgKDA = avgDeaths > 0 ? (avgKills + avgAssists) / avgDeaths : avgKills + avgAssists;
  const avgCS = totalGames > 0 ? totalCS / totalGames : 0;
  const avgDamage = totalGames > 0 ? totalDamage / totalGames : 0;
  const avgVisionScore = totalGames > 0 ? totalVisionScore / totalGames : 0;
  const winRate = totalMatches > 0 ? wins / totalMatches : 0;

  // Calculate KDA for each champion
  const championStatsWithKDA: Record<string, any> = {};
  for (const [champId, stats] of Object.entries(championStats)) {
    const champKDA = stats.deaths > 0
      ? (stats.kills + stats.assists) / stats.deaths
      : stats.kills + stats.assists;
    championStatsWithKDA[champId] = {
      ...stats,
      kda: champKDA,
    };
  }

  // Get the most recent match timestamp
  const mostRecentMatch = participants
    .filter(p => p.gameCreation)
    .sort((a, b) => (b.gameCreation || 0) - (a.gameCreation || 0))[0];
  const lastMatchFetched = mostRecentMatch?.gameCreation || Date.now();

  return {
    totalMatches,
    wins,
    losses,
    winRate,
    avgKDA: {
      kills: avgKills,
      deaths: avgDeaths,
      assists: avgAssists,
      ratio: avgKDA,
    },
    avgCS,
    avgDamage,
    avgVisionScore,
    championStats: championStatsWithKDA,
    roleStats,
    lastMatchFetched,
  };
}

/**
 * Handle processMatch mutation
 */
async function handleProcessMatch(args: { matchData: any }) {
  const client = getClient();
  
  // Validate match data before processing
  if (!isValidMatchData(args.matchData)) {
    throw new Error('Invalid match data: matchData is null, empty, or missing required fields');
  }
  
  const { matchCacheData, participantData } = processMatchData(args.matchData as MatchDto);

  // Store match in MatchCache with TTL
  try {
    await client.models.MatchCache.create({
      ...matchCacheData,
      ttl: getTTLTimestamp(),
    });
  } catch (error: any) {
    if (error?.message?.includes('already exists') || error?.message?.includes('duplicate')) {
      console.warn(`Match ${matchCacheData.matchId} already exists in cache, updating with TTL`);
      // Update with TTL
      try {
        await client.models.MatchCache.update({
          matchId: matchCacheData.matchId,
          ttl: getTTLTimestamp(),
        });
      } catch (updateError) {
        console.warn(`Failed to update TTL for match ${matchCacheData.matchId}:`, updateError);
      }
    } else {
      throw error;
    }
  }

  // Store each participant in MatchParticipantIndex
  let successCount = 0;
  let skippedCount = 0;

  for (const participant of participantData) {
    try {
      const result = await client.models.MatchParticipantIndex.create(participant);
      if (result.data) {
        successCount++;
      } else if (result.errors) {
        console.error(`Error creating participant - result.errors:`, JSON.stringify(result.errors, null, 2));
        const isDuplicate = Array.isArray(result.errors) 
          ? result.errors.some((err: any) =>
              err?.message?.includes('already exists') ||
              err?.message?.includes('duplicate')
            )
          : (typeof result.errors === 'object' && result.errors !== null && 
             ('message' in result.errors && 
              ((result.errors as any).message?.includes('already exists') || (result.errors as any).message?.includes('duplicate'))));
        if (isDuplicate) {
          console.warn(`Participant ${participant.puuid} in match ${participant.matchId} already exists, skipping`);
          skippedCount++;
        } else {
          const errorMessage = Array.isArray(result.errors)
            ? result.errors.map((e: any) => e?.message || JSON.stringify(e)).join(', ')
            : JSON.stringify(result.errors);
          throw new Error(errorMessage);
        }
      }
    } catch (error: any) {
      console.error(`Error creating participant record:`, JSON.stringify({
        matchId: participant.matchId,
        puuid: participant.puuid,
        error: error
      }, Object.getOwnPropertyNames(error), 2));
      if (error?.message?.includes('already exists') || error?.message?.includes('duplicate')) {
        console.warn(`Participant ${participant.puuid} in match ${participant.matchId} already exists, skipping`);
        skippedCount++;
      } else {
        throw error;
      }
    }
  }

  return {
    matchId: matchCacheData.matchId,
    success: true,
    participantsProcessed: successCount,
    participantsSkipped: skippedCount,
  };
};

/**
 * Handle aggregatePlayerStats mutation
 */
async function handleAggregatePlayerStats(args: { puuid: string; region?: string }) {
  const client = getClient();
  const { puuid } = args;

  // Fetch all match participants for this player
  const { data: participants, errors } = await client.models.MatchParticipantIndex.list({
    filter: { puuid: { eq: puuid } },
  });

  if (errors || !participants || participants.length === 0) {
    console.log(`No participants found for puuid: ${puuid}`);
    return {
      success: true,
      message: 'No participants found',
      puuid,
    };
  }

  console.log(`Aggregating stats from ${participants.length} matches for puuid: ${puuid}`);

  // Use pure function to calculate stats
  const stats = aggregateStatsForPlayer(participants);

  // Try to get Riot ID from account API via GraphQL (optional)
  let riotId: { gameName: string; tagLine: string } | undefined;
  try {
    const { data: accountData, errors: accountErrors } = await client.queries.getAccountByPuuid({
      puuid,
      region: 'americas',
    });

    if (!accountErrors && accountData) {
      const account = accountData as { gameName: string; tagLine: string; puuid: string };
      if (account && account.gameName && account.tagLine) {
        riotId = {
          gameName: account.gameName,
          tagLine: account.tagLine,
        };
      }
    }
  } catch (error) {
    console.warn(`Could not fetch Riot ID for puuid ${puuid}:`, error);
  }

  // Create or update PlayerStat
  const playerStatData: any = {
    puuid,
    totalMatches: stats.totalMatches,
    wins: stats.wins,
    losses: stats.losses,
    winRate: stats.winRate,
    avgKDA: stats.avgKDA,
    avgCS: stats.avgCS,
    avgDamage: stats.avgDamage,
    avgVisionScore: stats.avgVisionScore,
    championStats: stats.championStats,
    roleStats: stats.roleStats,
    lastUpdated: Date.now(),
    lastMatchFetched: stats.lastMatchFetched,
  };

  if (riotId) {
    playerStatData.riotId = riotId;
  }

  try {
    const { data: existingStat } = await client.models.PlayerStat.get({ puuid });

    if (existingStat) {
      await client.models.PlayerStat.update({
        puuid,
        ...playerStatData,
      });
      console.log(`Updated PlayerStat for puuid: ${puuid}`);
    } else {
      await client.models.PlayerStat.create(playerStatData);
      console.log(`Created PlayerStat for puuid: ${puuid}`);
    }
  } catch (error: any) {
    if (error?.message?.includes('not found') || error?.message?.includes('does not exist')) {
      try {
        await client.models.PlayerStat.create(playerStatData);
        console.log(`Created PlayerStat for puuid: ${puuid} (after update failed)`);
      } catch (createError) {
        console.error(`Failed to create PlayerStat for puuid: ${puuid}`, createError);
        throw createError;
      }
    } else {
      console.error(`Failed to update PlayerStat for puuid: ${puuid}`, error);
      throw error;
    }
  }

  return {
    success: true,
    puuid,
    stats,
  };
};

/**
 * Handle processMatches mutation
 */
async function handleProcessMatches(args: {
  puuid: string;
  matches?: any;
  matchIds?: string[];
  count?: number;
  region?: string;
}) {
  const client = getClient();
  const { puuid, matches, matchIds, count, region } = args;

  let matchesToProcess: MatchDto[] = [];

  // If matches are provided directly, use them
  if (matches && Array.isArray(matches) && matches.length > 0) {
    matchesToProcess = matches as MatchDto[];
  }
  // If match IDs are provided, fetch match details for each using GraphQL queries
  else if (matchIds && Array.isArray(matchIds) && matchIds.length > 0) {
    console.log(`Fetching ${matchIds.length} match details via GraphQL...`);
    matchesToProcess = await Promise.all(
      matchIds.map(async (matchId: string) => {
        try {
          const { data, errors } = await client.queries.getMatchDetails({
            matchId,
            region: region || 'americas',
          });

          if (errors || !data) {
            console.error(`Error fetching match ${matchId} - errors:`, JSON.stringify(errors, null, 2));
            console.error(`Error fetching match ${matchId} - data:`, JSON.stringify(data, null, 2));
            let errorMessage = 'No data returned';
            if (errors) {
              if (Array.isArray(errors)) {
                errorMessage = errors.map((e: any) => e?.message || JSON.stringify(e)).join(', ');
              } else if (typeof errors === 'object' && errors !== null) {
                errorMessage = JSON.stringify(errors);
              } else {
                errorMessage = String(errors);
              }
            }
            throw new Error(errorMessage);
          }

          return data as MatchDto;
        } catch (error) {
          console.error(`Failed to fetch match ${matchId}:`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
          throw error;
        }
      })
    );
  }
  // Otherwise, fetch match history and then match details using GraphQL queries
  else {
    console.log(`Fetching match history for puuid: ${puuid} (last 365 days) via GraphQL...`);
    try {
      const { data: matchIdsData, errors: matchIdsErrors } = await client.queries.fetchMatchIds({
        puuid,
        region: region || 'americas',
        count: count || 100,
        start: 0,
      });

      console.error(`fetchMatchIds response - data:`, JSON.stringify(matchIdsData, null, 2));
      console.error(`fetchMatchIds response - errors:`, JSON.stringify(matchIdsErrors, null, 2));

      if (matchIdsErrors) {
        let errorMessage = 'Failed to fetch match IDs';
        if (Array.isArray(matchIdsErrors)) {
          errorMessage = matchIdsErrors.map((e: any) => e?.message || JSON.stringify(e)).join(', ');
        } else if (typeof matchIdsErrors === 'object' && matchIdsErrors !== null) {
          errorMessage = JSON.stringify(matchIdsErrors);
        } else {
          errorMessage = String(matchIdsErrors);
        }
        throw new Error(errorMessage);
      }

      const matchIdsList = matchIdsData as string[];

      if (!matchIdsList || !Array.isArray(matchIdsList) || matchIdsList.length === 0) {
        console.error(`matchIdsList is not an array or is empty:`, JSON.stringify(matchIdsList, null, 2));
        return {
          success: true,
          processed: 0,
          puuid,
          message: 'No matches found for this player in the last year',
        };
      }

      console.log(`Found ${matchIdsList.length} matches from the last year, fetching details via GraphQL...`);
      matchesToProcess = await Promise.all(
        matchIdsList.map(async (matchId: string) => {
          try {
            const { data, errors } = await client.queries.getMatchDetails({
              matchId,
              region: region || 'americas',
            });

            if (errors || !data) {
              console.error(`Error fetching match ${matchId} - errors:`, JSON.stringify(errors, null, 2));
              console.error(`Error fetching match ${matchId} - data:`, JSON.stringify(data, null, 2));
              let errorMessage = 'No data returned';
              if (errors) {
                if (Array.isArray(errors)) {
                  errorMessage = errors.map((e: any) => e?.message || JSON.stringify(e)).join(', ');
                } else if (typeof errors === 'object' && errors !== null) {
                  errorMessage = JSON.stringify(errors);
                } else {
                  errorMessage = String(errors);
                }
              }
              throw new Error(errorMessage);
            }

            return data as MatchDto;
          } catch (error) {
            console.error(`Failed to fetch match ${matchId}:`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            throw error;
          }
        })
      );
    } catch (error) {
      console.error('Failed to fetch match history:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      throw error;
    }
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

  // Process each match using the pure function
  const results = await Promise.all(
    matchesToProcess.map(async (matchData: MatchDto) => {
      // Validate match data before processing
      if (!isValidMatchData(matchData)) {
        console.warn(`Skipping invalid match data for match ${matchData?.metadata?.matchId || 'unknown'}`);
        return {
          matchId: matchData?.metadata?.matchId || 'unknown',
          success: false,
          participantsProcessed: 0,
          participantsSkipped: 0,
        };
      }
      
      const { matchCacheData, participantData } = processMatchData(matchData);

      // Store match in MatchCache with TTL
      try {
        await client.models.MatchCache.create({
          ...matchCacheData,
          ttl: getTTLTimestamp(),
        });
      } catch (error: any) {
        if (error?.message?.includes('already exists') || error?.message?.includes('duplicate')) {
          console.warn(`Match ${matchCacheData.matchId} already exists in cache, updating with TTL`);
          // Update with TTL
          try {
            await client.models.MatchCache.update({
              matchId: matchCacheData.matchId,
              ttl: getTTLTimestamp(),
            });
          } catch (updateError) {
            console.warn(`Failed to update TTL for match ${matchCacheData.matchId}:`, updateError);
          }
        } else {
          throw error;
        }
      }

      // Store participants
      let successCount = 0;
      let skippedCount = 0;

      for (const participant of participantData) {
        try {
          const result = await client.models.MatchParticipantIndex.create(participant);
          if (result.data) {
            successCount++;
          } else if (result.errors) {
            console.error(`Error creating participant - result.errors:`, JSON.stringify(result.errors, null, 2));
            const isDuplicate = Array.isArray(result.errors) 
              ? result.errors.some((err: any) =>
                  err?.message?.includes('already exists') ||
                  err?.message?.includes('duplicate')
                )
              : (typeof result.errors === 'object' && result.errors !== null && 
                 ('message' in result.errors && 
                  ((result.errors as any).message?.includes('already exists') || (result.errors as any).message?.includes('duplicate'))));
            if (isDuplicate) {
              skippedCount++;
            } else {
              const errorMessage = Array.isArray(result.errors)
                ? result.errors.map((e: any) => e?.message || JSON.stringify(e)).join(', ')
                : JSON.stringify(result.errors);
              throw new Error(errorMessage);
            }
          }
        } catch (error: any) {
          console.error(`Error creating participant record:`, JSON.stringify({
            matchId: participant.matchId,
            puuid: participant.puuid,
            error: error
          }, Object.getOwnPropertyNames(error), 2));
          if (error?.message?.includes('already exists') || error?.message?.includes('duplicate')) {
            skippedCount++;
          } else {
            throw error;
          }
        }
      }

      return {
        matchId: matchCacheData.matchId,
        success: true,
        participantsProcessed: successCount,
        participantsSkipped: skippedCount,
      };
    })
  );

  const successCount = results.filter(r => r.success).length;
  const totalParticipants = results.reduce((sum, r) => sum + (r.participantsProcessed || 0), 0);

  // Aggregate player stats after processing matches
  console.log(`Aggregating player stats for puuid: ${puuid}...`);
  try {
    const { data: participants } = await client.models.MatchParticipantIndex.list({
      filter: { puuid: { eq: puuid } },
    });

    if (participants && participants.length > 0) {
      const stats = aggregateStatsForPlayer(participants);

      let riotId: { gameName: string; tagLine: string } | undefined;
      try {
        const { data: accountData } = await client.queries.getAccountByPuuid({
          puuid,
          region: 'americas',
        });

        if (accountData) {
          const account = accountData as { gameName: string; tagLine: string };
          if (account.gameName && account.tagLine) {
            riotId = { gameName: account.gameName, tagLine: account.tagLine };
          }
        }
      } catch (error) {
        // Ignore
      }

      const playerStatData: any = {
        puuid,
        ...stats,
        lastUpdated: Date.now(),
      };

      if (riotId) {
        playerStatData.riotId = riotId;
      }

      try {
        const { data: existingStat } = await client.models.PlayerStat.get({ puuid });
        if (existingStat) {
          await client.models.PlayerStat.update({ puuid, ...playerStatData });
        } else {
          await client.models.PlayerStat.create(playerStatData);
        }
      } catch (error: any) {
        if (error?.message?.includes('not found') || error?.message?.includes('does not exist')) {
          await client.models.PlayerStat.create(playerStatData);
        }
      }
    }
    } catch (error) {
      console.error('Error aggregating player stats:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      // Don't fail the entire operation if stats aggregation fails
    }

  return {
    success: true,
    processed: successCount,
    totalMatches: matchesToProcess.length,
    participantsProcessed: totalParticipants,
    puuid,
  };
};

/**
 * Main handler that routes to the appropriate handler based on field name
 * Amplify Gen 2 routes all mutations to the same function, so we need to route internally
 * Uses typed arguments from Schema for type safety
 */
type GraphQLResolverEvent = {
  arguments?: any;
  info?: {
    fieldName?: string;
    [key: string]: any;
  };
  fieldName?: string;
  [key: string]: any;
};

export const handler = async (event: GraphQLResolverEvent) => {
  const args = event.arguments || {};
  const info = event.info || {};
  const fieldName = info.fieldName || event.fieldName;

  if (!fieldName) {
    console.error('No field name found in event');
    throw new Error('No field name found in GraphQL event');
  }

  try {
    switch (fieldName) {
      case 'processMatch':
        return await handleProcessMatch(args as { matchData: any });
      case 'processMatches':
        return await handleProcessMatches(args as {
          puuid: string;
          matches?: any;
          matchIds?: string[];
          count?: number;
          region?: string;
        });
      case 'aggregatePlayerStats':
        return await handleAggregatePlayerStats(args as { puuid: string; region?: string });
      default:
        throw new Error(`Unknown field: ${fieldName}`);
    }
  } catch (error) {
    console.error(`Error in ${fieldName} handler:`, error);
    throw error;
  }
};
