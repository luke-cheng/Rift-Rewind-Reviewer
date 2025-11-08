# AWS-Based LoL Gameplay Performance Analyzer - Architecture

## Overview

Public MVP for League of Legends gameplay performance analyzer. No authentication required - anyone can look up any player's match history and performance statistics.

## Core Services

- **AWS Lambda**: Riot API integration and data processing
- **Amazon DynamoDB**: Match storage and player statistics
- **AWS AppSync**: GraphQL API (public access, no auth)
- **CloudWatch**: Logging and monitoring
- **Next.js Frontend**: Player search and statistics visualization

---

## Frontend

### Pages & Components

**Player Search Page**

- Input: Riot ID (gameName + tagLine), region selector
- Action: Calls `searchPlayer` mutation
- Displays: Loading state, error handling, redirect to player stats

**Player Stats Dashboard**

- Displays: Win rate, KDA, CS, damage, vision score
- Champion performance breakdown
- Role performance (top, jungle, mid, adc, support)
- Recent match history list
- Match details on click

**Match Details View**

- Full match information
- Participant stats
- Team composition
- Game timeline (if timeline data available)

### Implementation

- Remove auth UI components
- Create player search form component
- Create stats visualization components (charts, tables)
- Add region selector (AMERICAS, ASIA, EUROPE, SEA)
- Handle loading and error states
- Responsive design for mobile and desktop

**Files to Create/Modify**:

- `app/page.tsx` - Player search page
- `app/player/[puuid]/page.tsx` - Player stats dashboard
- `app/match/[matchId]/page.tsx` - Match details view
- `components/PlayerSearch.tsx` - Search form component
- `components/StatsDashboard.tsx` - Stats visualization
- `components/MatchHistory.tsx` - Match list component

---

## Lambda Functions

### fetchRiotData

**Purpose**: Handle all Riot API calls with rate limiting

**Functions**:

- `getPUUID(gameName, tagLine, region)`: Get player PUUID from Riot ID
- `getMatchIds(puuid, region, filters)`: Get match ID list for player
- `getMatchDetails(matchId, region)`: Get full match data

**Rate Limiting**:

- Riot API limit: 100 requests per 2 minutes per API key
- Track request timestamps in memory/function state
- Implement exponential backoff on rate limit errors
- Add delays between batch requests

**Regional Routing**:

- AMERICAS: NA, BR, LAN, LAS
- ASIA: KR, JP
- EUROPE: EUNE, EUW, ME1, TR, RU
- SEA: OCE, SG2, TW2, VN2

**Error Handling**:

- Retry logic for transient errors
- Handle 404 (player not found)
- Handle 429 (rate limit)
- Log errors to CloudWatch

**Environment Variables**:

- `RIOT_API_KEY`: Riot API key (stored in Amplify environment)

**Files to Create**:

- `amplify/functions/fetchRiotData/resource.ts`
- `amplify/functions/fetchRiotData/handler.ts`
- `amplify/functions/fetchRiotData/riot-api-client.ts` - API client utilities

---

### analyzeMatches

**Purpose**: Compute performance metrics from match data

**Input**: PUUID, region

**Process**:

1. Fetch all matches for player from DynamoDB
2. Filter by region if specified
3. Compute aggregate statistics:
   - Total matches, wins, losses
   - Win rate percentage
   - Average KDA (kills, deaths, assists)
   - Average CS (minions killed)
   - Average damage dealt
   - Average vision score
   - Champion performance (win rate per champion, games played)
   - Role performance (win rate per role, games played)
   - Average game duration
   - Gold earned statistics

**Output**: PlayerStat object with computed metrics

**Files to Create**:

- `amplify/functions/analyzeMatches/resource.ts`
- `amplify/functions/analyzeMatches/handler.ts`
- `amplify/functions/analyzeMatches/stat-calculator.ts` - Stat computation logic

---

## Data Models

### Match Model

**Table**: Matches
**Partition Key**: `matchId` (String)
**Global Secondary Index**: `puuid-gameCreation-index`

- Partition Key: `puuid` (String)
- Sort Key: `gameCreation` (Number)

**Attributes**:

- `matchId`: String (required)
- `puuid`: String (required, for GSI)
- `gameCreation`: Number (required, Unix timestamp)
- `matchData`: JSON (full MatchDto from Riot API)
- `region`: String (routing region)
- `processedAt`: Number (timestamp when processed)

**Authorization**: Public read access via API key

---

### PlayerStat Model

**Table**: PlayerStats
**Partition Key**: `puuid` (String)
**Sort Key**: `region` (String)

**Attributes**:

- `puuid`: String (required)
- `region`: String (required)
- `riotId`: Object (gameName, tagLine)
- `totalMatches`: Number
- `wins`: Number
- `losses`: Number
- `winRate`: Number (percentage)
- `avgKDA`: Object (kills, deaths, assists)
- `avgCS`: Number
- `avgDamage`: Number
- `avgVisionScore`: Number
- `championStats`: JSON (champion performance breakdown)
- `roleStats`: JSON (role performance breakdown)
- `lastUpdated`: Number (timestamp)
- `lastMatchFetched`: Number (timestamp)

**Authorization**: Public read access via API key

---

### GraphQL Schema

```graphql
type Match {
  matchId: String!
  puuid: String!
  gameCreation: Int!
  matchData: AWSJSON!
  region: String!
  processedAt: Int
}

type PlayerStat {
  puuid: String!
  region: String!
  riotId: RiotId
  totalMatches: Int
  wins: Int
  losses: Int
  winRate: Float
  avgKDA: KDA
  avgCS: Float
  avgDamage: Float
  avgVisionScore: Float
  championStats: AWSJSON
  roleStats: AWSJSON
  lastUpdated: Int
}

type RiotId {
  gameName: String!
  tagLine: String!
}

type KDA {
  kills: Float!
  deaths: Float!
  assists: Float!
}

type Query {
  getPlayerStats(puuid: String!, region: String): PlayerStat
  getMatchHistory(puuid: String!, region: String, limit: Int): [Match]
  getMatchDetails(matchId: String!): Match
}

type Mutation {
  searchPlayer(gameName: String!, tagLine: String!, region: String!): PlayerStat
  syncPlayerMatches(puuid: String!, region: String!): SyncResult
  refreshPlayerStats(puuid: String!, region: String!): PlayerStat
}

type SyncResult {
  success: Boolean!
  matchesAdded: Int
  message: String
}
```

**Files to Modify**:

- `amplify/data/resource.ts` - Define Match and PlayerStat models with public API key authorization

---

## AppSync / GraphQL API

### Queries

**getPlayerStats**

- Input: puuid (required), region (optional)
- Resolver: Query DynamoDB PlayerStats table
- Returns: PlayerStat object or null

**getMatchHistory**

- Input: puuid (required), region (optional), limit (optional, default 20)
- Resolver: Query DynamoDB Matches table via GSI
- Returns: Array of Match objects, sorted by gameCreation (newest first)

**getMatchDetails**

- Input: matchId (required)
- Resolver: Query DynamoDB Matches table by matchId
- Returns: Match object or null

---

### Mutations

**searchPlayer**

- Input: gameName, tagLine, region
- Resolver:
  1. Call Lambda `fetchRiotData.getPUUID()` to get PUUID
  2. Check if PlayerStats exists in DynamoDB
  3. If missing or stale, call `syncPlayerMatches` internally
  4. Return PlayerStat
- Returns: PlayerStat object

**syncPlayerMatches**

- Input: puuid, region
- Resolver:
  1. Call Lambda `fetchRiotData.getMatchIds()` to get match IDs
  2. For each match ID, check if exists in DynamoDB
  3. For missing matches, call `fetchRiotData.getMatchDetails()` (with rate limiting)
  4. Store matches in DynamoDB
  5. Call Lambda `analyzeMatches` to compute stats
  6. Update PlayerStats in DynamoDB
- Returns: SyncResult with success status and matches added count

**refreshPlayerStats**

- Input: puuid, region
- Resolver:
  1. Call Lambda `analyzeMatches` to recompute stats
  2. Update PlayerStats in DynamoDB
  3. Return updated PlayerStat
- Returns: PlayerStat object

---

### Custom Resolvers

**Lambda Resolvers**:

- `searchPlayer` mutation → Lambda `fetchRiotData`
- `syncPlayerMatches` mutation → Lambda `fetchRiotData` + `analyzeMatches`
- `refreshPlayerStats` mutation → Lambda `analyzeMatches`

**DynamoDB Resolvers**:

- `getPlayerStats` query → DynamoDB PlayerStats table
- `getMatchHistory` query → DynamoDB Matches table (GSI)
- `getMatchDetails` query → DynamoDB Matches table

**Files to Modify**:

- `amplify/data/resource.ts` - Define custom resolvers for Lambda functions

---

## Analytics & Insights

### Performance Metrics Calculation

**Basic Statistics**:

- Win rate: (wins / totalMatches) \* 100
- Average KDA: Sum of (kills + assists) / deaths (handle zero deaths)
- Average CS per minute: (totalCS / totalGameTime) \* 60
- Average damage per minute: (totalDamage / totalGameTime) \* 60

**Champion Performance**:

- Group matches by champion
- Calculate win rate per champion
- Track games played per champion
- Sort by win rate or games played

**Role Performance**:

- Group matches by teamPosition (TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY)
- Calculate win rate per role
- Track games played per role
- Average performance metrics per role

**Advanced Metrics** (Optional for MVP):

- Gold efficiency
- Vision score impact
- Objective participation
- Damage share percentage
- Kill participation rate

**Files to Create**:

- `amplify/functions/analyzeMatches/stat-calculator.ts` - Core calculation logic
- `utils/performance-metrics.ts` - Frontend utility functions for displaying metrics

---

## Data Flow

### Initial Player Lookup

1. User enters Riot ID (gameName + tagLine) and selects region
2. Frontend calls `searchPlayer` mutation via AppSync
3. AppSync resolver calls Lambda `fetchRiotData.getPUUID()`
4. Lambda calls Riot API Account v1 endpoint
5. Returns PUUID to AppSync
6. AppSync checks DynamoDB for existing PlayerStats
7. If missing or stale (>24 hours), triggers `syncPlayerMatches`
8. Returns PlayerStat to frontend

### Match Synchronization

1. `syncPlayerMatches` mutation called (manually or automatically)
2. AppSync resolver calls Lambda `fetchRiotData.getMatchIds()`
3. Lambda calls Riot API Match v5 endpoint for match IDs
4. For each match ID:
   - Check if match exists in DynamoDB
   - If missing, call `fetchRiotData.getMatchDetails()`
   - Store match in DynamoDB
   - Respect rate limits (add delays between requests)
5. After all matches stored, call Lambda `analyzeMatches`
6. Lambda computes statistics from all matches
7. Update PlayerStats in DynamoDB
8. Return SyncResult to frontend

### Querying Data

1. Frontend calls `getPlayerStats` query
2. AppSync queries DynamoDB PlayerStats table
3. Returns PlayerStat object
4. Frontend displays statistics

5. Frontend calls `getMatchHistory` query
6. AppSync queries DynamoDB Matches table via GSI (puuid-gameCreation)
7. Returns sorted list of matches
8. Frontend displays match history

---

## Configuration

### Environment Variables

**Lambda Functions**:

- `RIOT_API_KEY`: Riot Games API key
- `DYNAMODB_TABLE_MATCHES`: Matches table name
- `DYNAMODB_TABLE_PLAYER_STATS`: PlayerStats table name
- `REGION`: AWS region (e.g., us-east-1)

**Frontend**:

- `NEXT_PUBLIC_APPSYNC_URL`: AppSync GraphQL endpoint
- `NEXT_PUBLIC_APPSYNC_API_KEY`: AppSync API key (for public access)

### Riot API Key Management

- Store API key in Amplify environment variables
- Access via `process.env.RIOT_API_KEY` in Lambda
- Consider rotating keys periodically
- Monitor rate limit usage in CloudWatch logs

**Files to Modify**:

- `amplify/backend.ts` - Remove auth if not needed
- Environment configuration in Amplify console

---

## Monitoring & Logging

### CloudWatch Logs

**Lambda Logs**:

- Function invocation logs
- Error logs with stack traces
- Rate limit warnings
- API call duration metrics

**AppSync Logs**:

- GraphQL query/mutation logs
- Resolver execution logs
- Error logs

### Key Metrics to Monitor

- Lambda invocation count and errors
- DynamoDB read/write capacity usage
- AppSync query/mutation count
- Riot API rate limit utilization
- Match synchronization success rate
- Average response times

### Error Handling

- Log all errors to CloudWatch
- Return user-friendly error messages
- Handle Riot API errors gracefully (404, 429, 500)
- Retry transient errors automatically
- Alert on repeated failures

---

## Deployment

### Amplify Hosting

- Frontend: Next.js app hosted on Amplify
- Backend: Amplify Gen 2 backend (Lambda + DynamoDB + AppSync)
- CI/CD: Automatic deployment via `amplify.yml`

### Build Process

1. Install dependencies: `npm ci`
2. Build backend: `npx ampx pipeline-deploy`
3. Build frontend: `npm run build`
4. Deploy to Amplify hosting

**Files to Modify**:

- `amplify.yml` - Already configured for Amplify deployment

---

## Future Enhancements (Post-MVP)

- **Caching**: Add ElastiCache for frequently accessed data
- **Scheduled Updates**: EventBridge rules for automatic match synchronization
- **Advanced Analytics**: Machine learning for performance predictions
- **Match Timeline**: Add timeline endpoint for detailed game analysis
- **Export Features**: PDF/CSV export of player statistics
- **Comparison Tools**: Compare multiple players side-by-side
- **Trend Analysis**: Performance trends over time
- **Champion Recommendations**: AI-powered champion suggestions based on performance

---

## File Structure

```
amplify/
  functions/
    fetchRiotData/
      resource.ts
      handler.ts
      riot-api-client.ts
    analyzeMatches/
      resource.ts
      handler.ts
      stat-calculator.ts
  data/
    resource.ts (Match, PlayerStat models)
  backend.ts

app/
  page.tsx (Player search)
  player/
    [puuid]/
      page.tsx (Player stats dashboard)
  match/
    [matchId]/
      page.tsx (Match details)

components/
  PlayerSearch.tsx
  StatsDashboard.tsx
  MatchHistory.tsx
  MatchCard.tsx

utils/
  performance-metrics.ts
  riot-api-types.ts (already exists in types/riot-api/)
```
