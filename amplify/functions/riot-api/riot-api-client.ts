/**
 * Riot Games API Client
 * 
 * A TypeScript client for interacting with Riot Games API endpoints
 */

import type {
  AccountDto,
  AccountByPuuidDto,
  MatchDto,
  MatchIdsDto,
  MatchTimelineDto,
} from '@/types/riot';
import { RiotRegion, RiotPlatformId } from '@/types/riot';

export interface RiotApiClientConfig {
  /** Riot API Key */
  apiKey: string;
  /** Default region for account API calls */
  defaultRegion?: RiotRegion;
  /** Default platform ID for match API calls */
  defaultPlatformId?: RiotPlatformId;
}

/**
 * Maps a platform ID to its corresponding regional routing endpoint
 * Match-V5 API uses regional routing (americas, asia, europe, sea) not platform IDs
 */
function getRegionFromPlatform(platformId: RiotPlatformId): RiotRegion {
  const platformToRegion: Record<RiotPlatformId, RiotRegion> = {
    [RiotPlatformId.BR1]: RiotRegion.AMERICAS,
    [RiotPlatformId.LA1]: RiotRegion.AMERICAS,
    [RiotPlatformId.LA2]: RiotRegion.AMERICAS,
    [RiotPlatformId.NA1]: RiotRegion.AMERICAS,
    [RiotPlatformId.OC1]: RiotRegion.AMERICAS,
    [RiotPlatformId.JP1]: RiotRegion.ASIA,
    [RiotPlatformId.KR]: RiotRegion.ASIA,
    [RiotPlatformId.PH2]: RiotRegion.ASIA,
    [RiotPlatformId.SG2]: RiotRegion.ASIA,
    [RiotPlatformId.TH2]: RiotRegion.ASIA,
    [RiotPlatformId.TW2]: RiotRegion.ASIA,
    [RiotPlatformId.VN2]: RiotRegion.ASIA,
    [RiotPlatformId.EUN1]: RiotRegion.EUROPE,
    [RiotPlatformId.EUW1]: RiotRegion.EUROPE,
    [RiotPlatformId.RU]: RiotRegion.EUROPE,
    [RiotPlatformId.TR1]: RiotRegion.EUROPE,
  };
  
  return platformToRegion[platformId] || RiotRegion.AMERICAS;
}

export interface GetMatchHistoryOptions {
  /** PUUID of the player */
  puuid: string;
  /** Platform ID (e.g., RiotPlatformId.NA1) */
  platformId?: RiotPlatformId;
  /** Start index (default: 0) */
  start?: number;
  /** Number of matches to return (default: 20, max: 100) */
  count?: number;
  /** Start time (Unix timestamp in seconds) */
  startTime?: number;
  /** End time (Unix timestamp in seconds) */
  endTime?: number;
  /** Queue ID filter */
  queue?: number;
  /** Match type filter */
  type?: string;
}

/**
 * Riot Games API Client
 */
export class RiotApiClient {
  private apiKey: string;
  private defaultRegion: RiotRegion;
  private defaultPlatformId: RiotPlatformId;

  private readonly ACCOUNT_API_BASE_URL = 'https://{region}.api.riotgames.com/riot/account/v1';
  private readonly MATCH_API_BASE_URL = 'https://{region}.api.riotgames.com/lol/match/v5';

  constructor(config: RiotApiClientConfig) {
    this.apiKey = config.apiKey;
    this.defaultRegion = config.defaultRegion || RiotRegion.AMERICAS;
    this.defaultPlatformId = config.defaultPlatformId || RiotPlatformId.NA1;
  }

  /**
   * Get account by Riot ID (gameName + tagLine)
   * 
   * @param gameName - Player's game name
   * @param tagLine - Player's tag line
   * @param region - Optional region (defaults to configured default)
   * @returns Account information including PUUID
   */
  async getAccountByRiotId(
    gameName: string,
    tagLine: string,
    region?: RiotRegion
  ): Promise<AccountDto> {
    const r = region || this.defaultRegion;
    const url = `${this.ACCOUNT_API_BASE_URL.replace('{region}', r)}/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    
    const response = await fetch(url, {
      headers: {
        'X-Riot-Token': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Riot API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get account by PUUID
   * 
   * @param puuid - Player's PUUID
   * @param region - Optional region (defaults to configured default)
   * @returns Account information
   */
  async getAccountByPuuid(
    puuid: string,
    region?: RiotRegion
  ): Promise<AccountByPuuidDto> {
    const r = region || this.defaultRegion;
    const url = `${this.ACCOUNT_API_BASE_URL.replace('{region}', r)}/accounts/by-puuid/${puuid}`;
    
    const response = await fetch(url, {
      headers: {
        'X-Riot-Token': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Riot API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get match IDs by PUUID
   * 
   * @param options - Match history options
   * @returns Array of match IDs
   */
  async getMatchHistory(options: GetMatchHistoryOptions): Promise<MatchIdsDto> {
    const {
      puuid,
      platformId,
      start = 0,
      count = 20,
      startTime,
      endTime,
      queue,
      type,
    } = options;

    const platform = platformId || this.defaultPlatformId;
    const region = getRegionFromPlatform(platform);
    const url = new URL(
      `${this.MATCH_API_BASE_URL.replace('{region}', region)}/matches/by-puuid/${puuid}/ids`
    );

    // Add query parameters
    if (start !== undefined) url.searchParams.set('start', start.toString());
    if (count !== undefined) url.searchParams.set('count', count.toString());
    if (startTime !== undefined) url.searchParams.set('startTime', startTime.toString());
    if (endTime !== undefined) url.searchParams.set('endTime', endTime.toString());
    if (queue !== undefined) url.searchParams.set('queue', queue.toString());
    if (type !== undefined) url.searchParams.set('type', type);

    const response = await fetch(url.toString(), {
      headers: {
        'X-Riot-Token': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Riot API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get match details by match ID
   * 
   * @param matchId - Match ID
   * @param platformId - Optional platform ID (defaults to configured default)
   * @returns Match details
   */
  async getMatchDetails(
    matchId: string,
    platformId?: RiotPlatformId
  ): Promise<MatchDto> {
    const platform = platformId || this.defaultPlatformId;
    const region = getRegionFromPlatform(platform);
    const url = `${this.MATCH_API_BASE_URL.replace('{region}', region)}/matches/${matchId}`;
    
    const response = await fetch(url, {
      headers: {
        'X-Riot-Token': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Riot API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get PUUID from Riot ID (convenience method)
   * 
   * @param gameName - Player's game name
   * @param tagLine - Player's tag line
   * @param region - Optional region (defaults to configured default)
   * @returns PUUID string
   */
  async getPuuidByRiotId(
    gameName: string,
    tagLine: string,
    region?: RiotRegion
  ): Promise<string> {
    const account = await this.getAccountByRiotId(gameName, tagLine, region);
    return account.puuid;
  }

  /**
   * Get match history with details (convenience method)
   * 
   * @param options - Match history options
   * @returns Array of match details
   */
  async getMatchHistoryWithDetails(
    options: GetMatchHistoryOptions
  ): Promise<MatchDto[]> {
    const matchIds = await this.getMatchHistory(options);
    const platformId = options.platformId || this.defaultPlatformId;

    // Fetch all matches in parallel (be mindful of rate limits)
    const matches = await Promise.all(
      matchIds.map((matchId: string) => this.getMatchDetails(matchId, platformId))
    );

    return matches;
  }

  /**
   * Get match timeline by match ID
   * 
   * The timeline endpoint provides frame-by-frame data about events that occurred during the match.
   * This is different from the match endpoint which provides aggregate match statistics.
   * 
   * Timeline data includes:
   * - Champion kills, deaths, and assists
   * - Item purchases, sales, and undo
   * - Skill level ups
   * - Ward placements and kills
   * - Building (tower/inhibitor) kills
   * - Elite monster (dragon/baron) kills
   * - Participant positions and stats over time
   * 
   * @param matchId - Match ID
   * @param platformId - Optional platform ID (defaults to configured default)
   * @returns Match timeline with frames and events
   */
  async getMatchTimeline(
    matchId: string,
    platformId?: RiotPlatformId
  ): Promise<MatchTimelineDto> {
    const platform = platformId || this.defaultPlatformId;
    const region = getRegionFromPlatform(platform);
    const url = `${this.MATCH_API_BASE_URL.replace('{region}', region)}/matches/${matchId}/timeline`;
    
    const response = await fetch(url, {
      headers: {
        'X-Riot-Token': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Riot API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get match details with timeline (convenience method)
   * 
   * Fetches both match details and timeline data for a complete view of the match.
   * 
   * @param matchId - Match ID
   * @param platformId - Optional platform ID (defaults to configured default)
   * @returns Object containing both match details and timeline
   */
  async getMatchWithTimeline(
    matchId: string,
    platformId?: RiotPlatformId
  ): Promise<{ match: MatchDto; timeline: MatchTimelineDto }> {
    const platform = platformId || this.defaultPlatformId;

    // Fetch both in parallel
    const [match, timeline] = await Promise.all([
      this.getMatchDetails(matchId, platform),
      this.getMatchTimeline(matchId, platform),
    ]);

    return { match, timeline };
  }

  /**
   * Get region from platform ID (public helper method)
   * 
   * @param platformId - Platform ID
   * @returns Corresponding region for API routing
   */
  getRegionFromPlatform(platformId: RiotPlatformId): RiotRegion {
    return getRegionFromPlatform(platformId);
  }
}

/**
 * Create a Riot API client instance
 * 
 * @param config - Client configuration
 * @returns Riot API client instance
 */
export function createRiotApiClient(config: RiotApiClientConfig): RiotApiClient {
  return new RiotApiClient(config);
}

