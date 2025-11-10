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
      processedAt: a.integer(),
      aiInsights: a.json(),
    })
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
    })
    .returns(a.json())
    .handler(a.handler.function("riotApiFunction"))
    .authorization((allow) => [allow.guest()]),

  fetchMatches: a
    .query()
    .arguments({
      puuid: a.string().required(),
      count: a.integer(),
    })
    .returns(a.json())
    .handler(a.handler.function("riotApiFunction"))
    .authorization((allow) => [allow.guest()]),

  processMatches: a
    .mutation()
    .arguments({
      puuid: a.string().required(),
      matches: a.json().required(),
    })
    .returns(a.json())
    .handler(a.handler.function("dataProcessorFunction"))
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