/**
 * TypeScript interfaces for Rift Rewind Reviewer data structures
 */

import type { MatchDto } from "@/types/riot/match-v5";

/**
 * AI Insights structure
 */
export interface AIInsights {
  severity: "no-issue" | "info" | "warning";
  summary?: string; // 2-4 word badge text
  analysis?: string; // 2-3 sentence detailed coaching insight
}

/**
 * Match Participant data (from MatchParticipantIndex)
 */
export interface MatchParticipant {
  id: string;
  puuid: string;
  matchId: string;
  gameCreation: number;
  win?: boolean;
  kills?: number;
  deaths?: number;
  assists?: number;
  kda?: number;
  championId?: number;
  championName?: string;
  lane?: string;
  role?: string;
  teamPosition?: string;
  queueId?: number;
  gameMode?: string;
  totalDamageDealt?: number;
  totalDamageDealtToChampions?: number;
  totalMinionsKilled?: number;
  visionScore?: number;
  goldEarned?: number;
  goldSpent?: number;
  timePlayed?: number;
  totalTimeSpentDead?: number;
  teamId?: number;
  gameDuration?: number;
  processedAt?: number;
  aiInsights?: AIInsights;
}

/**
 * Match Data (from MatchCache)
 */
export interface MatchData {
  matchId: string;
  gameCreation: number;
  matchData?: MatchDto;
  timelineData?: any;
  expiresAt?: number;
  processedAt?: number;
  aiInsights?: AIInsights;
}

/**
 * Player Stats (from PlayerStat)
 */
export interface PlayerStats {
  puuid: string;
  riotId?: {
    gameName: string;
    tagLine: string;
  };
  totalMatches?: number;
  wins?: number;
  losses?: number;
  winRate?: number;
  avgKDA?: {
    kills: number;
    deaths: number;
    assists: number;
    ratio: number;
  };
  avgCS?: number;
  avgDamage?: number;
  avgVisionScore?: number;
  championStats?: {
    [championId: string]: {
      wins: number;
      losses: number;
      kda: number;
      games: number;
      [key: string]: any;
    };
  };
  roleStats?: {
    [position: string]: {
      wins: number;
      losses: number;
      games: number;
      [key: string]: any;
    };
  };
  lastUpdated?: number;
  lastMatchFetched?: number;
  aiInsights?: AIInsights;
}

