import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

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
    .secondaryIndexes((index) => [
      index("gameCreation"),
    ])
    .authorization((allow) => [allow.guest()]),

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
    .authorization((allow) => [allow.guest()]),

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
    .authorization((allow) => [allow.guest()]),

  searchPlayer: a
    .query()
    .arguments({
      gameName: a.string().required(),
      tagLine: a.string().required(),
      region: a.string(),
    })
    .returns(a.json())
    .handler(a.handler.function("riotApiFunction"))
    .authorization((allow) => [allow.guest()]),

  fetchMatches: a
    .query()
    .arguments({
      puuid: a.string().required(),
      count: a.integer(),
      platformId: a.string(),
    })
    .returns(a.json())
    .handler(a.handler.function("riotApiFunction"))
    .authorization((allow) => [allow.guest()]),

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
    .handler(a.handler.function("dataProcessorFunction"))
    .authorization((allow) => [allow.guest()]),

  // AI Generation route for player stats insights
  generatePlayerInsights: a
    .generation({
      aiModel: a.ai.model("Claude 3.5 Haiku"),
      systemPrompt: `You are an expert League of Legends coach analyzing player performance statistics. 
      Analyze the provided player statistics and generate actionable insights. 
      Focus on identifying strengths, weaknesses, and areas for improvement.
      Return insights in a structured format with severity level, summary, and detailed analysis.`,
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
    .authorization((allow) => [allow.guest()]),

  // AI Generation route for match insights
  generateMatchInsights: a
    .generation({
      aiModel: a.ai.model("Claude 3.5 Haiku"),
      systemPrompt: `You are an expert League of Legends coach analyzing individual match performance. 
      Analyze the provided match data and generate actionable insights about the player's performance in this specific match.
      Focus on key moments, decision-making, and specific areas for improvement.
      Return insights in a structured format with severity level, summary, and detailed analysis.`,
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
    .authorization((allow) => [allow.guest()]),
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