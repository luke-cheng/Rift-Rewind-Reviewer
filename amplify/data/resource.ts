import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  /**
   * MatchCache - Stores complete match data from Riot API
   * Primary use: Cache match details to avoid repeated API calls
   * 
   * Lookup pattern: Query by matchId (unique identifier from Riot API)
   * Storage efficiency: Match data stored once instead of 10 times (one per player)
   */
  MatchCache: a
    .model({
      // Unique match identifier from Riot API (e.g., "NA1_1234567890")
      // Used as the primary lookup key for cache hits
      matchId: a.string().required(),
      
      // Unix timestamp (milliseconds) when game was created on the game server
      gameCreation: a.integer().required(),
      
      // Complete match data from Riot API (MatchDto)
      // Contains: metadata, info (participants, teams, etc.)
      matchData: a.json().required(),
      
      // Match timeline data (optional, stored separately to reduce payload size)
      // Contains: frames, events (kills, item purchases, etc.)
      timelineData: a.json(),
      
      // TTL timestamp for cache expiration (Unix timestamp in seconds)
      // Matches are typically immutable, so long TTL is acceptable
      expiresAt: a.integer(),
      
      // Metadata for processing/analysis
      processedAt: a.integer(),
      aiInsights: a.json(),
      
      // Relationship: Match has many participant index entries
      participants: a.hasMany("MatchParticipantIndex", "matchId"),
    })
    .identifier(["matchId"])
    .secondaryIndexes((index) => [
      // Index for querying matches by creation time (for cleanup/analytics)
      index("gameCreation"),
    ])
    .authorization((allow) => [allow.publicApiKey()]),

  /**
   * MatchParticipantIndex - Links matches to participants for efficient queries
   * 
   * Purpose: Enable efficient queries like "get all matches for player X"
   * Since DynamoDB doesn't support array indexes, we denormalize by creating
   * one record per participant per match (10 records per match).
   * 
   * Lookup pattern: Query by puuid, sorted by gameCreation (descending)
   * Display data: Includes participant stats for fast match history list rendering
   */
  MatchParticipantIndex: a
    .model({
      // Player's PUUID (encrypted unique identifier)
      puuid: a.string().required(),
      
      // Match ID this participant belongs to
      matchId: a.string().required(),
      
      // Game creation timestamp for sorting (Unix milliseconds)
      gameCreation: a.integer().required(),
      
      // Match outcome for this participant
      win: a.boolean(),
      
      // Participant stats for match history list display
      kills: a.integer(),
      deaths: a.integer(),
      assists: a.integer(),
      
      // KDA ratio (computed: (kills + assists) / deaths or kills + assists if deaths = 0)
      kda: a.float(),
      
      // Champion information
      championId: a.integer(),
      championName: a.string(),
      
      // Lane/role/position information
      lane: a.string(), // TOP, JUNGLE, MIDDLE, BOTTOM
      role: a.string(), // SOLO, NONE, CARRY, SUPPORT, DUO
      teamPosition: a.string(), // TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY
      
      // Match metadata
      queueId: a.integer(), // e.g., 420 for Ranked, 450 for ARAM
      gameMode: a.string(), // e.g., "CLASSIC", "ARAM"
      
      // Metadata for processing
      processedAt: a.integer(),
      
      // AI-generated insights for this specific match performance
      aiInsights: a.json(),
      
      // Relationships: Participant belongs to a match and a player
      match: a.belongsTo("MatchCache", "matchId"),
      player: a.belongsTo("PlayerStat", "puuid"),
    })
    .secondaryIndexes((index) => [
      // Primary index: Query a player's match history by PUUID, sorted by gameCreation (descending)
      // Enables efficient queries: "Get all matches for PUUID X, ordered by time (newest first)"
      // Supports time range filtering: puuid = X AND gameCreation >= year_start
      index("puuid").sortKeys(["gameCreation"]),
      // Secondary index: Query matches by matchId (to get all participants in a match)
      index("matchId"),
    ])
    .authorization((allow) => [allow.publicApiKey()]),

  /**
   * PlayerStat - Aggregated player statistics computed from matches
   * 
   * Primary use: Store computed/aggregated statistics and AI-generated insights
   * This data is derived from MatchCache and MatchParticipantIndex records
   * 
   * Lookup pattern: Query by PUUID (primary)
   */
  PlayerStat: a
    .model({
      // Primary key: PUUID (unique player identifier)
      puuid: a.string().required(),
      
      // Riot ID (stored as JSON: { gameName, tagLine })
      // Cached for display purposes, can be refreshed from AccountCache
      riotId: a.json(),
      
      // Match statistics
      totalMatches: a.integer(),
      wins: a.integer(),
      losses: a.integer(),
      winRate: a.float(), // wins / totalMatches
      
      // Average performance metrics (computed from all matches)
      avgKDA: a.json(), // { kills: number, deaths: number, assists: number, ratio: number }
      avgCS: a.float(), // Average creep score per minute
      avgDamage: a.float(), // Average total damage dealt
      avgVisionScore: a.float(),
      
      // Champion statistics
      // JSON structure: { [championId: string]: { wins: number, losses: number, kda: number, games: number, ... } }
      championStats: a.json(),
      
      // Role/position statistics
      // JSON structure: { [position: string]: { wins: number, losses: number, games: number, ... } }
      // Positions: TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY
      roleStats: a.json(),
      
      // Timestamps (Unix milliseconds)
      lastUpdated: a.integer(), // Last time stats were recalculated
      lastMatchFetched: a.integer(), // Last match creation timestamp included in stats
      
      // AI-generated insights and analysis
      // Contains: performance trends, improvement suggestions, etc.
      aiInsights: a.json(),
      
      // Relationship: Player has many match participant entries
      matches: a.hasMany("MatchParticipantIndex", "puuid"),
    })
    .identifier(["puuid"])
    .authorization((allow) => [allow.publicApiKey()]),

  /**
   * AI Generation Routes for Bedrock Integration
   * These routes use Amazon Bedrock to analyze League of Legends match data
   * and generate actionable coaching insights.
   */

  /**
   * Analyze Match History - Analyzes a player's recent match history for patterns
   * Returns AI-generated insights about player performance trends, tilt patterns, role preferences, etc.
   */
  analyzeMatchHistory: a
    .generation({
      aiModel: a.ai.model("Claude 3.5 Haiku"),
      systemPrompt: `You are an expert League of Legends coach. Analyze player match history data and provide actionable insights.

Your task is to identify patterns and provide coaching feedback. Look for:
- Back-to-back ranked games after losses (tilt patterns)
- New champions being played in ranked matches
- Frequent role/position swapping
- Performance trends over time
- Win/loss streaks
- Champion pool diversity

Return ONLY valid JSON in this exact format (no markdown, no code blocks, just the JSON object):
{
  "severity": "no-issue" | "info" | "warning",
  "summary": "2-4 words describing the insight (or empty string if no-issue)",
  "analysis": "2-3 sentences providing detailed coaching insight (or empty string if no-issue)"
}

Severity levels:
- "no-issue": No significant patterns or issues found
- "info": Interesting patterns or positive trends worth noting
- "warning": Problematic patterns that need attention (tilt, role swapping, etc.)

Be concise but actionable in your analysis.`,
    })
    .arguments({
      // Player's PUUID
      puuid: a.string().required(),
      // Match history data (array of match summaries)
      matchData: a.json().required(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.publicApiKey()]),

  /**
   * Analyze Single Match - Analyzes a single match performance
   * Returns AI-generated insights about the player's performance in this specific match
   */
  analyzeSingleMatch: a
    .generation({
      aiModel: a.ai.model("Claude 3.5 Haiku"),
      systemPrompt: `You are an expert League of Legends coach. Analyze a single match performance and provide actionable insights.

Your task is to evaluate the player's performance in this match and provide coaching feedback. Consider:
- KDA ratio and performance relative to role
- Champion performance
- Win/loss outcome
- Role/position played
- Game mode (Ranked, ARAM, etc.)

Return ONLY valid JSON in this exact format (no markdown, no code blocks, just the JSON object):
{
  "severity": "no-issue" | "info" | "warning",
  "summary": "2-4 words describing the insight (or empty string if no-issue)",
  "analysis": "2-3 sentences providing detailed coaching insight (or empty string if no-issue)"
}

Severity levels:
- "no-issue": Performance was acceptable
- "info": Notable performance (good or needs minor improvement)
- "warning": Poor performance or concerning patterns

Be concise but actionable in your analysis.`,
    })
    .arguments({
      // Match ID
      matchId: a.string().required(),
      // Player's PUUID
      puuid: a.string().required(),
      // Match performance data
      matchData: a.json().required(),
    })
    .returns(a.json())
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

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>

