import {
  type ClientSchema,
  a,
  defineData,
} from "@aws-amplify/backend";
import { riotApiHttpFunction } from '../functions/riot-api-http/resource';
import { dataProcessorFunction } from '../functions/data-processor/resource';

const schema = a.schema({
  MatchCache: a
    .model({
      matchId: a.string().required(),
      gameCreation: a.integer().required(),
      matchData: a.json().required(),
      timelineData: a.json(),
      expiresAt: a.integer(),
      processedAt: a.integer(),
      aiInsights: a.json(),
    })
    .identifier(["matchId"])
    .secondaryIndexes((index) => [index("gameCreation")])
    .authorization((allow) => [allow.publicApiKey()]),

  MatchParticipantIndex: a
    .model({
      puuid: a.string().required(),
      matchId: a.string().required(),
      gameCreation: a.integer().required(),
      win: a.boolean(),
      kills: a.integer(),
      deaths: a.integer(),
      assists: a.integer(),
      kda: a.float(),
      championId: a.integer(),
      championName: a.string(),
      lane: a.string(),
      role: a.string(),
      teamPosition: a.string(),
      queueId: a.integer(),
      gameMode: a.string(),
      totalDamageDealt: a.integer(),
      totalDamageDealtToChampions: a.integer(),
      totalMinionsKilled: a.integer(),
      visionScore: a.integer(),
      goldEarned: a.integer(),
      goldSpent: a.integer(),
      timePlayed: a.integer(),
      totalTimeSpentDead: a.integer(),
      teamId: a.integer(),
      gameDuration: a.integer(),
      processedAt: a.integer(),
      aiInsights: a.json(),
    })
    .identifier(["puuid", "matchId"])
    .secondaryIndexes((index) => [
      index("puuid").sortKeys(["gameCreation"]),
      index("matchId"),
    ])
    .authorization((allow) => [allow.publicApiKey()]),

  PlayerStat: a
    .model({
      puuid: a.string().required(),
      riotId: a.json(),
      totalMatches: a.integer(),
      wins: a.integer(),
      losses: a.integer(),
      winRate: a.float(),
      avgKDA: a.json(),
      avgCS: a.float(),
      avgDamage: a.float(),
      avgVisionScore: a.float(),
      championStats: a.json(),
      roleStats: a.json(),
      lastUpdated: a.integer(),
      lastMatchFetched: a.integer(),
      aiInsights: a.json(),
    })
    .identifier(["puuid"])
    .authorization((allow) => [allow.publicApiKey()]),

  searchPlayer: a
    .query()
    .arguments({
      gameName: a.string().required(),
      tagLine: a.string().required(),
      region: a.string(),
    })
    .returns(a.json())
    .handler(a.handler.function(riotApiHttpFunction))
    .authorization((allow) => [allow.publicApiKey()]),

  fetchMatchIds: a
    .query()
    .arguments({
      puuid: a.string().required(),
      count: a.integer(),
      platformId: a.string(),
      start: a.integer(),
    })
    .returns(a.json())
    .handler(a.handler.function(riotApiHttpFunction))
    .authorization((allow) => [allow.publicApiKey()]),

  getMatchDetails: a
    .query()
    .arguments({
      matchId: a.string().required(),
      platformId: a.string(),
    })
    .returns(a.json())
    .handler(a.handler.function(riotApiHttpFunction))
    .authorization((allow) => [allow.publicApiKey()]),

  getMatchTimeline: a
    .query()
    .arguments({
      matchId: a.string().required(),
      platformId: a.string(),
    })
    .returns(a.json())
    .handler(a.handler.function(riotApiHttpFunction))
    .authorization((allow) => [allow.publicApiKey()]),

  getAccountByPuuid: a
    .query()
    .arguments({
      puuid: a.string().required(),
      region: a.string(),
    })
    .returns(a.json())
    .handler(a.handler.function(riotApiHttpFunction))
    .authorization((allow) => [allow.publicApiKey()]),

  processMatches: a
    .mutation()
    .arguments({
      puuid: a.string().required(),
      matches: a.json(), // Optional: if provided, will use these matches instead of fetching
      matchIds: a.json(), // Optional: array of match IDs to fetch
      count: a.integer(), // Optional: number of matches to fetch (default: 20)
      platformId: a.string(), // Optional: platform ID for Riot API
    })
    .returns(a.json())
    .handler(a.handler.function(dataProcessorFunction))
    .authorization((allow) => [allow.publicApiKey()]),

  processMatch: a
    .mutation()
    .arguments({
      matchData: a.json().required(), // Match data from Riot API
    })
    .returns(a.json())
    .handler(a.handler.function(dataProcessorFunction))
    .authorization((allow) => [allow.publicApiKey()]),

  aggregatePlayerStats: a
    .mutation()
    .arguments({
      puuid: a.string().required(),
      platformId: a.string(), // Optional: platform ID for Riot API
    })
    .returns(a.json())
    .handler(a.handler.function(dataProcessorFunction))
    .authorization((allow) => [allow.publicApiKey()]),

  // AI Generation route for player stats insights, use for player profile page
  generatePlayerInsights: a
    .generation({
      aiModel: a.ai.model("Claude 3.5 Haiku"),
      systemPrompt: `You are an expert League of Legends coach analyzing player performance statistics. 
      Analyze the provided player statistics and generate actionable insights. 
      Focus on identifying strengths, weaknesses, and areas for improvement, be rough and concise.
      Return insights in a structured format with severity level (no-issue, info, warning), summary (few words critical comment on the player's playstyle like kamakaze tower diver, city boi can't farm, etc.), and detailed analysis (one paragraph sentences support by reasoning).`,
    })
    .arguments({
      playerStats: a.json().required(), // Player statistics data
    })
    .returns(
      a.customType({
        severity: a.string(), // "no-issue" | "info" | "warning"
        summary: a.string(), // 2-4 word summary
        analysis: a.string(), // 2-3 sentence detailed analysis
      })
    )
    .authorization((allow) => [allow.publicApiKey()]),

  // AI Generation route for match insights, use for the evaluation the match history page with multiple matches
  generateMatchInsights: a
    .generation({
      aiModel: a.ai.model("Claude 3.5 Haiku"),
      systemPrompt: `You are an expert League of Legends coach analyzing individual match performance. 
      Analyze the provided match history and generate actionable insights about the player's performance in this specific match.
      Focus on key moments, decision-making, and specific areas for improvement.
      Return insights in a structured format with severity level (no-issue, info, warning), summary (few words classification like tilted, learning new champion, etc.), and detailed analysis (paragraph sentences support by reasoning).`,
    })
    .arguments({
      matchData: a.json().required(), // Match participant data
    })
    .returns(
      a.customType({
        severity: a.string(), // "no-issue" | "info" | "warning"
        summary: a.string(), // 2-4 word summary
        analysis: a.string(), // 2-3 sentence detailed analysis
      })
    )
    .authorization((allow) => [allow.publicApiKey()]),

  // AI Generation route for timeline insights, use for the individual match detail page
  generateTimelineInsights: a
    .generation({
      aiModel: a.ai.model("Claude 3.5 Haiku"),
      systemPrompt: `You are an expert League of Legends coach analyzing the timeline of a match.
      Analyze the provided timeline data and generate actionable insights about the player's performance in this specific match.
      Focus on key moments, call out bad decision-making, and specific areas for improvement.
      Return insights in a structured format with a list of timestamp, severity level (info, warning), summary (few words classification like noob, you'd see this gank coming, etc.), and detailed analysis (paragraph sentences support by reasoning).
      Returns an array of timeline insights: Array<{ timestamp: number, severity: string, summary: string, analysis: string }>
      The severity level should be one of the following:
      - info: The player made a good decision.
      - warning: The player made a bad decision.
      The summary should be a few words classification like noob, you'd see this gank coming, why split pushing?, etc.
      The detailed analysis should be a paragraph sentences support by reasoning.
      `,
    })
    .arguments({
      timelineData: a.json().required(), // Timeline data
    })
    .returns(
      // Returns an array of timeline insights: Array<{ timestamp: number, severity: string, summary: string, analysis: string }>
      a.json()
    )
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
