/**
 * Riot Games API - TypeScript DTOs
 * 
 * Comprehensive type definitions for Riot Games API endpoints
 */

export * from './account-v1';
export * from './match-v5';
export * from './match-timeline-v5';

/**
 * Riot API Regions
 */
export enum RiotRegion {
  /** Americas */
  AMERICAS = 'americas',
  /** Asia */
  ASIA = 'asia',
  /** Europe */
  EUROPE = 'europe',
  /** Southeast Asia */
  SEA = 'sea',
}

/**
 * Riot API Platform IDs (for match history)
 */
export enum RiotPlatformId {
  /** Brazil */
  BR1 = 'br1',
  /** Europe Nordic & East */
  EUN1 = 'eun1',
  /** Europe West */
  EUW1 = 'euw1',
  /** Japan */
  JP1 = 'jp1',
  /** Korea */
  KR = 'kr',
  /** Latin America North */
  LA1 = 'la1',
  /** Latin America South */
  LA2 = 'la2',
  /** North America */
  NA1 = 'na1',
  /** Oceania */
  OC1 = 'oc1',
  /** Philippines */
  PH2 = 'ph2',
  /** Russia */
  RU = 'ru',
  /** Singapore */
  SG2 = 'sg2',
  /** Thailand */
  TH2 = 'th2',
  /** Turkey */
  TR1 = 'tr1',
  /** Taiwan */
  TW2 = 'tw2',
  /** Vietnam */
  VN2 = 'vn2',
}

/**
 * Match Queue IDs
 */
export enum MatchQueueId {
  /** Custom games */
  CUSTOM = 0,
  /** Normal 5v5 Blind Pick */
  NORMAL_5V5_BLIND = 400,
  /** Ranked Solo 5v5 */
  RANKED_SOLO_5V5 = 420,
  /** Normal 5v5 Draft Pick */
  NORMAL_5V5_DRAFT = 440,
  /** Ranked Flex 5v5 */
  RANKED_FLEX_5V5 = 430,
  /** ARAM */
  ARAM = 450,
  /** Clash */
  CLASH = 700,
  /** Bot 5v5 Intermediate */
  BOT_5V5_INTERMEDIATE = 830,
  /** Bot 5v5 Intro */
  BOT_5V5_INTRO = 840,
  /** Bot 5v5 Beginner */
  BOT_5V5_BEGINNER = 850,
  /** All Random URF */
  ALL_RANDOM_URF = 900,
  /** Nexus Blitz */
  NEXUS_BLITZ = 1300,
}

/**
 * Match Type
 */
export enum MatchType {
  /** Custom games */
  CUSTOM = 'CUSTOM_GAME',
  /** Matched games */
  MATCHED = 'MATCHED_GAME',
  /** Tutorial games */
  TUTORIAL = 'TUTORIAL_GAME',
}

/**
 * Game Mode
 */
export enum GameMode {
  /** Classic Summoner's Rift */
  CLASSIC = 'CLASSIC',
  /** ARAM */
  ARAM = 'ARAM',
  /** Tutorial */
  TUTORIAL = 'TUTORIAL',
  /** URF */
  URF = 'URF',
  /** Doom Bots Voting */
  DOOM_BOTS_VOTING = 'DOOMBOTSTEEMO',
  /** One for All */
  ONE_FOR_ALL = 'ONEFORALL',
  /** Ascension */
  ASCENSION = 'ASCENSION',
  /** Snowdown Showdown 1v1 */
  SHOWDOWN_1V1 = 'FIRSTBLOOD',
  /** Snowdown Showdown 2v2 */
  SHOWDOWN_2V2 = 'FIRSTBLOOD',
  /** Hexakill */
  HEXAKILL = 'HEXAKILL',
  /** King Poro */
  KING_PORO = 'KINGPORO',
  /** Counter Pick */
  COUNTER_PICK = 'COUNTER_PICK',
  /** Bilgewater: Black Market Brawlers */
  BILGEWATER = 'BILGEWATER',
  /** Nexus Siege */
  NEXUS_SIEGE = 'SIEGE',
  /** Definitely Not Dominion */
  DEFINITELY_NOT_DOMINION = 'DEFINITELY_NOT_DOMINION',
  /** ARURF */
  ARURF = 'ARURF',
  /** All Random Summoner's Rift */
  ALL_RANDOM = 'ARSR',
  /** Normal 5v5 Draft Pick */
  NORMAL_5V5_DRAFT = 'DRAFT',
  /** Ranked Flex */
  RANKED_FLEX = 'RANKED_FLEX',
  /** All Random URF */
  ALL_RANDOM_URF = 'ARURF',
  /** Nexus Blitz */
  NEXUS_BLITZ = 'NEXUS_BLITZ',
}

/**
 * Champion Transform (Kayn specific)
 */
export enum ChampionTransform {
  /** None */
  NONE = 0,
  /** Slayer (Red Kayn) */
  SLAYER = 1,
  /** Assassin (Blue Kayn) */
  ASSASSIN = 2,
}

/**
 * Lane Position
 * 
 * The lane field represents the actual lane where the player spent most of their time.
 * Note: Lane does not include UTILITY or NONE - those are only in teamPosition/individualPosition.
 */
export enum Lane {
  TOP = 'TOP',
  JUNGLE = 'JUNGLE',
  MIDDLE = 'MIDDLE',
  BOTTOM = 'BOTTOM',
}

/**
 * Team Position
 * 
 * Team position is computed with the constraint that each team must have one of each position.
 * Can be empty string if position cannot be determined.
 */
export enum TeamPosition {
  TOP = 'TOP',
  JUNGLE = 'JUNGLE',
  MIDDLE = 'MIDDLE',
  BOTTOM = 'BOTTOM',
  UTILITY = 'UTILITY',
}

/**
 * Individual Position
 * 
 * Individual position is the best guess for which position the player actually played in isolation.
 * Can be empty string if position cannot be determined.
 */
export enum IndividualPosition {
  TOP = 'TOP',
  JUNGLE = 'JUNGLE',
  MIDDLE = 'MIDDLE',
  BOTTOM = 'BOTTOM',
  UTILITY = 'UTILITY',
}

/**
 * Role
 * 
 * Role represents the player's assigned role in the game.
 */
export enum Role {
  SOLO = 'SOLO',
  NONE = 'NONE',
  CARRY = 'CARRY',
  SUPPORT = 'SUPPORT',
  DUO = 'DUO',
}

