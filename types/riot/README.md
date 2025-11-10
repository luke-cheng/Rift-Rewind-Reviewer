# Riot Games API TypeScript DTOs

This directory contains comprehensive TypeScript Data Transfer Objects (DTOs) for the Riot Games API, specifically for:

- **Account-V1 API**: For retrieving player accounts by Riot ID (gameName + tagLine) and getting PUUIDs
- **Match-V5 API**: For retrieving match history and match details
- **Match Timeline-V5 API**: For retrieving frame-by-frame match timeline data with events

## Setup

1. Get your Riot API key from [Riot Developer Portal](https://developer.riotgames.com/)
2. Add your API key to your environment variables.

## Usage

## Type Definitions

All Riot API response types are available in this directory:

- `AccountDto` - Account information
- `MatchDto` - Match details with full participant and team data
- `MatchIdsDto` - Array of match IDs
- `MatchTimelineDto` - Frame-by-frame timeline data with events
- `ParticipantDto` - Detailed participant statistics
- `TeamDto` - Team information and objectives
- `TimelineEventDto` - Individual timeline events (kills, item purchases, etc.)
- `ParticipantFrameDto` - Participant state at specific timestamps

## API Endpoints Covered

Base Url `https://${region}.api.riotgames.com/` where region can only be `americas`, `asia`, `europe`, `sea`

### Account-V1

- `GET /riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}` - Get account by Riot ID
- `GET /riot/account/v1/accounts/by-puuid/{puuid}` - Get account by PUUID

### Match-V5

- `GET /lol/match/v5/matches/by-puuid/{puuid}/ids` - Get match IDs by PUUID
- `GET /lol/match/v5/matches/{matchId}` - Get match details by match ID
- `GET /lol/match/v5/matches/{matchId}/timeline` - Get match timeline with frame-by-frame events

### Match vs Timeline Endpoints

**Match Endpoint (`/matches/{matchId}`):**

- Provides aggregate match statistics
- Final participant stats (K/D/A, damage, gold, items, etc.)
- Team outcomes and objectives
- Best for: Overall match summary and final performance metrics

**Timeline Endpoint (`/matches/{matchId}/timeline`):**

- Provides frame-by-frame event data throughout the match
- Chronological events: kills, item purchases, skill level ups, ward placements, etc.
- Participant positions and stats at specific timestamps
- Best for: Analyzing game progression, decision-making, and time-based coaching insights
- Note: Timeline data is available for 1 year (vs 2 years for match data)

## Files

- `account-v1.d.ts` - Account API DTOs
- `match-v5.d.ts` - Match API DTOs (comprehensive match and participant data)
- `match-timeline-v5.d.ts` - Match Timeline API DTOs (frame-by-frame events and participant states)
- `index.d.ts` - Main export file with enums and constants

## Type Validation

All type definitions have been validated against actual ranked match data from the Riot API to ensure accuracy. The enum values for:

- **Lane, TeamPosition, IndividualPosition, Role** - Validated from ranked match participant data
- **Timeline Event Types, Monster Types, Ward Types, Kill Types** - Validated from ranked match timeline data

This ensures type safety and accuracy when working with League of Legends ranked match data.

## Notes

- All DTOs are based on the official Riot Games API documentation
- All fields are included as per the API specification
- Optional fields are marked with `?`
- Enums are provided for common constants (regions, queue IDs, game modes, etc.)
- Types have been validated against actual ranked match API responses

## References

- [Riot Games API Documentation](https://developer.riotgames.com/)
- [Account-V1 API](https://developer.riotgames.com/apis#account-v1)
- [Match-V5 API](https://developer.riotgames.com/apis#match-v5)
