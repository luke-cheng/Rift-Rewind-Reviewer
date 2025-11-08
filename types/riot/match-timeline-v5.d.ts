/**
 * Riot Games API - Match Timeline-V5 DTOs
 * 
 * Documentation: https://developer.riotgames.com/apis#match-v5
 * 
 * The timeline endpoint provides frame-by-frame data about events that occurred during the match.
 * This is different from the match endpoint which provides aggregate match statistics.
 */

/**
 * Match Timeline DTO - Response from GET /lol/match/v5/matches/{matchId}/timeline
 */
export interface MatchTimelineDto {
  /** Match metadata */
  metadata: MatchTimelineMetadataDto;
  /** Timeline info with frames */
  info: MatchTimelineInfoDto;
}

/**
 * Match Timeline Metadata DTO
 */
export interface MatchTimelineMetadataDto {
  /** Match data version */
  dataVersion: string;
  /** Match ID */
  matchId: string;
  /** A list of participant PUUIDs */
  participants: string[];
}

/**
 * Match Timeline Info DTO
 */
export interface MatchTimelineInfoDto {
  /** Interval between frames */
  frameInterval: number;
  /** List of timeline frames */
  frames: TimelineFrameDto[];
  /** Game ID */
  gameId: number;
  /** List of timeline participants */
  participants: TimelineParticipantDto[];
}

/**
 * Timeline Frame DTO
 * 
 * Represents a single frame of the match timeline at a specific timestamp.
 */
export interface TimelineFrameDto {
  /** List of events for this frame */
  events: TimelineEventDto[];
  /** Participant frame data for this frame */
  participantFrames: { [key: string]: ParticipantFrameDto };
  /** Timestamp of the frame */
  timestamp: number;
}

/**
 * Timeline Event DTO
 * 
 * Represents an event that occurred during the match.
 */
export interface TimelineEventDto {
  /** Event timestamp (milliseconds) */
  timestamp: number;
  /** Event type */
  type: TimelineEventType;
  /** Real timestamp (milliseconds) */
  realTimestamp?: number;
  
  // Event-specific fields (only present for specific event types)
  
  /** Assisting participant IDs (for CHAMPION_KILL, etc.) */
  assistingParticipantIds?: number[];
  /** Bounty level (for CHAMPION_KILL) */
  bounty?: number;
  /** Build up level (for ITEM_DESTROYED, ITEM_SOLD) */
  buildUpLevel?: number;
  /** Item ID (for ITEM_PURCHASED, ITEM_SOLD, ITEM_DESTROYED, ITEM_UNDO) */
  itemId?: number;
  /** Killer ID (for CHAMPION_KILL) */
  killerId?: number;
  /** Killer team ID (for CHAMPION_KILL) */
  killerTeamId?: number;
  /** Lane type (for CHAMPION_KILL) */
  laneType?: string;
  /** Level up type (for LEVEL_UP) */
  levelUpType?: string;
  /** Monster sub type (for ELITE_MONSTER_KILL) */
  monsterSubType?: string;
  /** Monster type (for ELITE_MONSTER_KILL) */
  monsterType?: string;
  /** Participant ID */
  participantId?: number;
  /** Position */
  position?: PositionDto;
  /** Skill slot (for SKILL_LEVEL_UP) */
  skillSlot?: number;
  /** Team ID */
  teamId?: number;
  /** Victim ID (for CHAMPION_KILL) */
  victimId?: number;
  /** Victim damage dealt (for CHAMPION_KILL) */
  victimDamageDealt?: DamageStatsDto[];
  /** Victim damage received (for CHAMPION_KILL) */
  victimDamageReceived?: DamageStatsDto[];
  /** After ID (for ITEM_UNDO) */
  afterId?: number;
  /** Before ID (for ITEM_UNDO) */
  beforeId?: number;
  /** Gold gain (for ITEM_PURCHASED) */
  goldGain?: number;
  /** Multi kill type (for CHAMPION_KILL) */
  killType?: string;
  /** Multi kill length (for CHAMPION_KILL) */
  killStreakLength?: number;
  /** Name (for CHAMPION_KILL) */
  name?: string;
  /** Shutdown bounty (for CHAMPION_KILL) */
  shutdownBounty?: number;
  /** Tower type (for BUILDING_KILL) */
  towerType?: string;
  /** Building type (for BUILDING_KILL) */
  buildingType?: string;
  /** Creator ID (for WARD_PLACED) */
  creatorId?: number;
  /** Ward type (for WARD_PLACED, WARD_KILL) */
  wardType?: string;
  /** Game ID (for GAME_END) */
  gameId?: number;
  /** Winning team (for GAME_END) */
  winningTeam?: number;
  /** Acer (for CHAMPION_KILL) */
  ace?: string;
  /** Acing team (for CHAMPION_KILL) */
  acingTeam?: number;
  /** Feat type (for FEAT_UPDATE) */
  featType?: number;
  /** Feat value (for FEAT_UPDATE) */
  featValue?: number;
  /** Actual start time (for OBJECTIVE_BOUNTY_PRESTART) */
  actualStartTime?: number;
}

/**
 * Timeline Event Type
 */
export enum TimelineEventType {
  /** Champion killed */
  CHAMPION_KILL = 'CHAMPION_KILL',
  /** Ward placed */
  WARD_PLACED = 'WARD_PLACED',
  /** Ward killed */
  WARD_KILL = 'WARD_KILL',
  /** Building killed (tower/inhibitor) */
  BUILDING_KILL = 'BUILDING_KILL',
  /** Elite monster killed (dragon/baron) */
  ELITE_MONSTER_KILL = 'ELITE_MONSTER_KILL',
  /** Item purchased */
  ITEM_PURCHASED = 'ITEM_PURCHASED',
  /** Item sold */
  ITEM_SOLD = 'ITEM_SOLD',
  /** Item destroyed */
  ITEM_DESTROYED = 'ITEM_DESTROYED',
  /** Item undo */
  ITEM_UNDO = 'ITEM_UNDO',
  /** Skill level up */
  SKILL_LEVEL_UP = 'SKILL_LEVEL_UP',
  /** Level up */
  LEVEL_UP = 'LEVEL_UP',
  /** Ascended event */
  ASCENDED_EVENT = 'ASCENDED_EVENT',
  /** Capture point */
  CAPTURE_POINT = 'CAPTURE_POINT',
  /** Pause end */
  PAUSE_END = 'PAUSE_END',
  /** Champion special kill */
  CHAMPION_SPECIAL_KILL = 'CHAMPION_SPECIAL_KILL',
  /** Champion transform */
  CHAMPION_TRANSFORM = 'CHAMPION_TRANSFORM',
  /** Dragon soul given */
  DRAGON_SOUL_GIVEN = 'DRAGON_SOUL_GIVEN',
  /** Game end */
  GAME_END = 'GAME_END',
  /** Turret plate destroyed */
  TURRET_PLATE_DESTROYED = 'TURRET_PLATE_DESTROYED',
  /** Feat update */
  FEAT_UPDATE = 'FEAT_UPDATE',
  /** Objective bounty prestart */
  OBJECTIVE_BOUNTY_PRESTART = 'OBJECTIVE_BOUNTY_PRESTART',
}

/**
 * Damage Stats DTO
 */
export interface DamageStatsDto {
  /** Basic damage */
  basic: boolean;
  /** Magic damage */
  magicDamage: number;
  /** Name */
  name: string;
  /** Participant ID */
  participantId: number;
  /** Physical damage */
  physicalDamage: number;
  /** Spell name */
  spellName: string;
  /** Spell slot */
  spellSlot: number;
  /** True damage */
  trueDamage: number;
  /** Type */
  type: string;
}

/**
 * Participant Frame DTO
 * 
 * Represents participant state at a specific frame timestamp.
 */
export interface ParticipantFrameDto {
  /** Champion stats */
  championStats: ChampionStatsDto;
  /** Current gold */
  currentGold: number;
  /** Damage stats */
  damageStats: DamageStatsDto;
  /** Gold per second */
  goldPerSecond: number;
  /** Jungle minions killed */
  jungleMinionsKilled: number;
  /** Level */
  level: number;
  /** Minions killed */
  minionsKilled: number;
  /** Participant ID */
  participantId: number;
  /** Position */
  position: PositionDto;
  /** Time enemy spent controlled */
  timeEnemySpentControlled: number;
  /** Total gold */
  totalGold: number;
  /** XP */
  xp: number;
}

/**
 * Champion Stats DTO
 */
export interface ChampionStatsDto {
  /** Ability haste */
  abilityHaste: number;
  /** Ability power */
  abilityPower: number;
  /** Armor */
  armor: number;
  /** Armor penetration */
  armorPen: number;
  /** Armor penetration percent */
  armorPenPercent: number;
  /** Attack damage */
  attackDamage: number;
  /** Attack speed */
  attackSpeed: number;
  /** Bonus armor penetration percent */
  bonusArmorPenPercent: number;
  /** Bonus magic penetration percent */
  bonusMagicPenPercent: number;
  /** CCR (Crowd Control Reduction) */
  ccReduction: number;
  /** Cooldown reduction */
  cooldownReduction: number;
  /** Health */
  health: number;
  /** Health max */
  healthMax: number;
  /** Health regen */
  healthRegen: number;
  /** Lifesteal */
  lifesteal: number;
  /** Magic penetration */
  magicPen: number;
  /** Magic penetration percent */
  magicPenPercent: number;
  /** Magic resistance */
  magicResist: number;
  /** Movement speed */
  movementSpeed: number;
  /** Omnivamp */
  omnivamp: number;
  /** Physical vamp */
  physicalVamp: number;
  /** Power */
  power: number;
  /** Power max */
  powerMax: number;
  /** Power regen */
  powerRegen: number;
  /** Spell vamp */
  spellVamp: number;
}

/**
 * Position DTO
 */
export interface PositionDto {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
}

/**
 * Timeline Participant DTO
 */
export interface TimelineParticipantDto {
  /** Participant ID */
  participantId: number;
  /** PUUID */
  puuid: string;
}

/**
 * Lane Type
 * 
 * Used in timeline events (different from match endpoint which uses TOP, JUNGLE, MIDDLE, BOTTOM).
 */
export enum LaneType {
  /** Bottom lane */
  BOT_LANE = 'BOT_LANE',
  /** Mid lane */
  MID_LANE = 'MID_LANE',
  /** Top lane */
  TOP_LANE = 'TOP_LANE',
}

/**
 * Monster Type
 * 
 */
export enum MonsterType {
  /** Baron Nashor */
  BARON_NASHOR = 'BARON_NASHOR',
  /** Dragon */
  DRAGON = 'DRAGON',
  /** Rift Herald */
  RIFTHERALD = 'RIFTHERALD',
  /** Horde (new monster type) */
  HORDE = 'HORDE',
  /** Atakhan (new monster type) */
  ATAKHAN = 'ATAKHAN',
}

/**
 * Monster Sub Type
 * 
 * Only applies to DRAGON monster type.
 */
export enum MonsterSubType {
  /** Air Dragon */
  AIR_DRAGON = 'AIR_DRAGON',
  /** Earth Dragon */
  EARTH_DRAGON = 'EARTH_DRAGON',
  /** Fire Dragon */
  FIRE_DRAGON = 'FIRE_DRAGON',
  /** Hextech Dragon */
  HEXTECH_DRAGON = 'HEXTECH_DRAGON',
  /** Water Dragon (may appear in other game modes) */
  WATER_DRAGON = 'WATER_DRAGON',
  /** Elder Dragon (may appear in other game modes) */
  ELDER_DRAGON = 'ELDER_DRAGON',
  /** Chemical Dragon (may appear in other game modes) */
  CHEMICAL_DRAGON = 'CHEMICAL_DRAGON',
}

/**
 * Building Type
 * 
 */
export enum BuildingType {
  /** Tower building */
  TOWER_BUILDING = 'TOWER_BUILDING',
  /** Inhibitor building */
  INHIBITOR_BUILDING = 'INHIBITOR_BUILDING',
}

/**
 * Tower Type
 * 
 */
export enum TowerType {
  /** Outer turret */
  OUTER_TURRET = 'OUTER_TURRET',
  /** Inner turret */
  INNER_TURRET = 'INNER_TURRET',
  /** Base turret */
  BASE_TURRET = 'BASE_TURRET',
  /** Nexus turret */
  NEXUS_TURRET = 'NEXUS_TURRET',
}

/**
 * Ward Type
 * 
 */
export enum WardType {
  /** Yellow trinket */
  YELLOW_TRINKET = 'YELLOW_TRINKET',
  /** Control ward */
  CONTROL_WARD = 'CONTROL_WARD',
  /** Sight ward */
  SIGHT_WARD = 'SIGHT_WARD',
  /** Blue trinket */
  BLUE_TRINKET = 'BLUE_TRINKET',
}

/**
 * Kill Type
 * 
 */
export enum KillType {
  /** First blood kill */
  KILL_FIRST_BLOOD = 'KILL_FIRST_BLOOD',
  /** Multi kill */
  KILL_MULTI = 'KILL_MULTI',
  /** Ace kill */
  KILL_ACE = 'KILL_ACE',
}

/**
 * Level Up Type
 * 
 * EVOLVE may appear for champions with evolution mechanics (e.g., Kha'Zix, Kaisa).
 */
export enum LevelUpType {
  /** Normal level up */
  NORMAL = 'NORMAL',
  /** Evolution level up (for champions with evolution mechanics) */
  EVOLVE = 'EVOLVE',
}

/**
 * Champion Special Kill Type
 * 
 * Note: Based on API documentation. The actual CHAMPION_SPECIAL_KILL event uses the killType field
 * with values from KillType enum (KILL_FIRST_BLOOD, KILL_MULTI, KILL_ACE).
 * This enum may be used in other contexts.
 */
export enum ChampionSpecialKillType {
  /** First blood */
  FIRST_BLOOD = 'FIRST_BLOOD',
  /** Double kill */
  DOUBLE_KILL = 'DOUBLE_KILL',
  /** Triple kill */
  TRIPLE_KILL = 'TRIPLE_KILL',
  /** Quadra kill */
  QUADRA_KILL = 'QUADRA_KILL',
  /** Penta kill */
  PENTAKILL = 'PENTAKILL',
  /** Ace */
  ACE = 'ACE',
  /** Kill ace */
  KILL_ACE = 'KILL_ACE',
  /** Kill spree */
  KILL_SPREE = 'KILL_SPREE',
  /** Turret first blood */
  TURRET_FIRST_BLOOD = 'TURRET_FIRST_BLOOD',
  /** Unlocked */
  UNLOCKED = 'UNLOCKED',
}

