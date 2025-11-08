/**
 * Riot Games API - Match-V5 DTOs
 * 
 * Documentation: https://developer.riotgames.com/apis#match-v5
 */

/**
 * Match IDs DTO - Response from GET /lol/match/v5/matches/by-puuid/{puuid}/ids
 * 
 * Returns a list of match IDs. Query parameters:
 * - start?: number (default: 0)
 * - count?: number (default: 20, max: 100)
 * - startTime?: number (Unix timestamp in seconds)
 * - endTime?: number (Unix timestamp in seconds)
 * - queue?: number (Queue ID filter)
 * - type?: string (Match type filter)
 */
export type MatchIdsDto = string[];

/**
 * Match DTO - Response from GET /lol/match/v5/matches/{matchId}
 */
export interface MatchDto {
  /** Match metadata */
  metadata: MatchMetadataDto;
  /** Match info */
  info: MatchInfoDto;
}

/**
 * Match Metadata DTO
 */
export interface MatchMetadataDto {
  /** Match data version */
  dataVersion: string;
  /** Match ID */
  matchId: string;
  /** A list of participant PUUIDs */
  participants: string[];
}

/**
 * Match Info DTO
 */
export interface MatchInfoDto {
  /** Unix timestamp for when the game is created on the game server (i.e., the loading screen). */
  gameCreation: number;
  /** Prior to patch 11.20, this field returns the game length in milliseconds calculated from gameEndTimestamp - gameStartTimestamp.
   * Post patch 11.20, this field returns the max timePlayed of any participant in the game in seconds, which makes the behavior of this field consistent with that of match-v4.
   * The best way to get the exact game duration is to query the /timeline endpoint */
  gameDuration: number;
  /** Unix timestamp for when match ends on the game server. This timestamp can occasionally be significantly longer than when the match "ends".
   * The most reliable way of determining the timestamp for the end of the match would be to add the max time played of any participant to the gameStartTimestamp. */
  gameEndTimestamp: number;
  /** Game ID */
  gameId: number;
  /** Refer to the Game Constants documentation. */
  gameMode: string;
  /** Game name */
  gameName: string;
  /** Unix timestamp for when the game starts on the game server. */
  gameStartTimestamp: number;
  /** Game type */
  gameType: string;
  /** The first two parts can be used to determine the patch a game was played on. */
  gameVersion: string;
  /** Refer to the Game Constants documentation. */
  mapId: number;
  /** List of participants */
  participants: ParticipantDto[];
  /** Platform where the match was played. */
  platformId: string;
  /** Refer to the Game Constants documentation. */
  queueId: number;
  /** Teams information */
  teams: TeamDto[];
  /** Tournament code used to generate the match. This field is omitted if the match was not generated from a tournament code. */
  tournamentCode?: string;
}

/**
 * Participant DTO
 */
export interface ParticipantDto {
  /** Number of assists */
  assists: number;
  /** Player's team baron kills */
  baronKills: number;
  /** Bounty level. Each champion level is worth approximately 300 gold. */
  bountyLevel: number;
  /** Number of times this champion has taken the Challenger's buff */
  champExperience: number;
  /** Champion level at game start */
  champLevel: number;
  /** Champion ID. Refer to the Game Constants documentation. */
  champId: number;
  /** Champion name */
  championName: string;
  /** This field is currently only utilized for Kayn's transformations.
   * (Legal values: 0 - None, 1 - Slayer, 2 - Assassin) */
  championTransform: number;
  /** Number of consumables purchased */
  consumablesPurchased: number;
  /** Number of damage dealt on taken objectives */
  damageDealtToBuildings: number;
  /** Number of damage dealt on taken objectives */
  damageDealtToObjectives: number;
  /** Damage dealt on taken turrets */
  damageDealtToTurrets: number;
  /** Total damage dealt */
  damageSelfMitigated: number;
  /** Number of deaths */
  deaths: number;
  /** Number of detector wards placed */
  detectorWardsPlaced: number;
  /** Number of double kills */
  doubleKills: number;
  /** Dragon kills */
  dragonKills: number;
  /** Indicates if the participant got the first assist */
  firstBloodAssist: boolean;
  /** Indicates if the participant got the first blood */
  firstBloodKill: boolean;
  /** Indicates if the participant got the first tower assist */
  firstTowerAssist: boolean;
  /** Indicates if the participant got the first tower kill */
  firstTowerKill: boolean;
  /** Flag indicating if the participant invalidated their own surrender */
  gameEndedInEarlySurrender: boolean;
  /** Flag indicating if the participant surrendered early */
  gameEndedInSurrender: boolean;
  /** Gold earned */
  goldEarned: number;
  /** Gold spent */
  goldSpent: number;
  /** Both individualPosition and teamPosition are computed by the game server and are different versions of the most likely position played by a player.
   * The individualPosition is the best guess for which position the player actually played in isolation of anything else.
   * The teamPosition is the best guess for which position the player actually played if we add the constraint that each team must have one of each position.
   * Based on actual ranked match data: TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY, or empty string if position cannot be determined. */
  individualPosition: string;
  /** Number of inhibitor kills */
  inhibitorKills: number;
  /** Inhibitor takedowns */
  inhibitorTakedowns: number;
  /** Inhibitors lost */
  inhibitorsLost: number;
  /** First item ID */
  item0: number;
  /** Second item ID */
  item1: number;
  /** Third item ID */
  item2: number;
  /** Fourth item ID */
  item3: number;
  /** Fifth item ID */
  item4: number;
  /** Sixth item ID */
  item5: number;
  /** Seventh item ID (trinket) */
  item6: number;
  /** Number of items purchased */
  itemsPurchased: number;
  /** Number of killing sprees */
  killingSprees: number;
  /** Number of kills */
  kills: number;
  /** Lane. Based on actual ranked match data: TOP, JUNGLE, MIDDLE, BOTTOM (no UTILITY or NONE in lane field) */
  lane: string;
  /** Largest critical strike */
  largestCriticalStrike: number;
  /** Largest killing spree */
  largestKillingSpree: number;
  /** Largest multi kill */
  largestMultiKill: number;
  /** Longest time alive */
  longestTimeSpentLiving: number;
  /** Magic damage dealt */
  magicDamageDealt: number;
  /** Magic damage dealt to champions */
  magicDamageDealtToChampions: number;
  /** Magic damage taken */
  magicDamageTaken: number;
  /** Number of neutral minions killed */
  neutralMinionsKilled: number;
  /** Number of nexus kills */
  nexusKills: number;
  /** Nexus takedowns */
  nexusTakedowns: number;
  /** Nexus lost */
  nexusesLost: number;
  /** Objectives stolen */
  objectivesStolen: number;
  /** Objectives stolen assists */
  objectivesStolenAssists: number;
  /** Participant number */
  participantId: number;
  /** Number of penta kills */
  pentaKills: number;
  /** Perks / Runes Reforged Information */
  perks: PerksDto;
  /** Physical damage dealt */
  physicalDamageDealt: number;
  /** Physical damage dealt to champions */
  physicalDamageDealtToChampions: number;
  /** Physical damage taken */
  physicalDamageTaken: number;
  /** Player's team composition */
  profileIcon: number;
  /** Encrypted PUUID */
  puuid: string;
  /** Number of quadra kills */
  quadraKills: number;
  /** Riot ID name */
  riotIdName: string;
  /** Riot ID tagline */
  riotIdTagline: string;
  /** Player's assigned role. Based on actual ranked match data: SOLO, NONE, CARRY, SUPPORT, DUO */
  role: string;
  /** Sight wards purchased */
  sightWardsBoughtInGame: number;
  /** Number of spells cast */
  spell1Casts: number;
  /** Number of spells cast */
  spell2Casts: number;
  /** Number of spells cast */
  spell3Casts: number;
  /** Number of spells cast */
  spell4Casts: number;
  /** Summoner ID */
  summoner1Casts: number;
  /** Summoner ID */
  summoner1Id: number;
  /** Summoner ID */
  summoner2Casts: number;
  /** Summoner ID */
  summoner2Id: number;
  /** Encrypted summoner ID */
  summonerId: string;
  /** Summoner level */
  summonerLevel: number;
  /** Summoner name */
  summonerName: string;
  /** Team early surrendered */
  teamEarlySurrendered: boolean;
  /** Team ID */
  teamId: number;
  /** Team position. Based on actual ranked match data: TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY, or empty string */
  teamPosition: string;
  /** Time CCing others */
  timeCCingOthers: number;
  /** Time played */
  timePlayed: number;
  /** Total damage dealt */
  totalDamageDealt: number;
  /** Total damage dealt to champions */
  totalDamageDealtToChampions: number;
  /** Total damage self mitigated */
  totalDamageShieldedOnTeammates: number;
  /** Total damage taken */
  totalDamageTaken: number;
  /** Total heal */
  totalHeal: number;
  /** Total heal on teammates */
  totalHealsOnTeammates: number;
  /** Total minions killed */
  totalMinionsKilled: number;
  /** Total time crowd control dealt */
  totalTimeCCDealt: number;
  /** Total time spent dead */
  totalTimeSpentDead: number;
  /** Total units healed */
  totalUnitsHealed: number;
  /** Number of triple kills */
  tripleKills: number;
  /** True damage dealt */
  trueDamageDealt: number;
  /** True damage dealt to champions */
  trueDamageDealtToChampions: number;
  /** True damage taken */
  trueDamageTaken: number;
  /** Turret kills */
  turretKills: number;
  /** Turret takedowns */
  turretTakedowns: number;
  /** Turrets lost */
  turretsLost: number;
  /** Number of unreal kills */
  unrealKills: number;
  /** Vision score */
  visionScore: number;
  /** Vision wards purchased */
  visionWardsBoughtInGame: number;
  /** Number of wards killed */
  wardsKilled: number;
  /** Number of wards placed */
  wardsPlaced: number;
  /** Flag indicating whether or not the participant won */
  win: boolean;
}

/**
 * Perks / Runes Reforged Information
 */
export interface PerksDto {
  /** Primary rune tree information */
  statPerks: PerkStatsDto;
  /** Secondary rune tree information */
  styles: PerkStyleDto[];
}

/**
 * Perk Stats DTO
 */
export interface PerkStatsDto {
  /** Defense stat */
  defense: number;
  /** Flex stat */
  flex: number;
  /** Offense stat */
  offense: number;
}

/**
 * Perk Style DTO
 */
export interface PerkStyleDto {
  /** Description */
  description: string;
  /** Selections */
  selections: PerkStyleSelectionDto[];
  /** Style */
  style: number;
}

/**
 * Perk Style Selection DTO
 */
export interface PerkStyleSelectionDto {
  /** Perk */
  perk: number;
  /** Var1 */
  var1: number;
  /** Var2 */
  var2: number;
  /** Var3 */
  var3: number;
}

/**
 * Team DTO
 */
export interface TeamDto {
  /** List of team bans */
  bans: BanDto[];
  /** Objectives information */
  objectives: ObjectivesDto;
  /** Team ID */
  teamId: number;
  /** Whether the team won */
  win: boolean;
}

/**
 * Ban DTO
 */
export interface BanDto {
  /** Champion ID */
  championId: number;
  /** Pick turn */
  pickTurn: number;
}

/**
 * Objectives DTO
 */
export interface ObjectivesDto {
  /** Baron objective information */
  baron: ObjectiveDto;
  /** Champion objective information */
  champion: ObjectiveDto;
  /** Dragon objective information */
  dragon: ObjectiveDto;
  /** Inhibitor objective information */
  inhibitor: ObjectiveDto;
  /** Rift Herald objective information */
  riftHerald: ObjectiveDto;
  /** Tower objective information */
  tower: ObjectiveDto;
}

/**
 * Objective DTO
 */
export interface ObjectiveDto {
  /** Whether the objective was killed */
  first: boolean;
  /** Number of times the objective was killed */
  kills: number;
}

