# Rift Rewind Reviewer - Track, Reflect, Develop

## Overview

Submission for Rift [Rift Rewind Hackathon](https://riftrewind.devpost.com/) where we build an AI-powered agent using AWS AI services and a League API to help League of Legends players reflect, learn, and improve.

## Requirement

Using League Developer AI end-of-game match data, you’ll create an intelligent agent that generates personalized end-of-year insights players can actually use. The agent should help answer the kinds of questions players ask themselves or potentially even share surprising insights — highlighting trends, compiling key statistics and achievements, identifying areas for growth, and generating engaging retrospectives for players to celebrate and reflect on their past year in League.

Participants will work with the following dataset:

- **Full-Year Match History** – use this to identify growth areas, uncover persistent habits, and generate an end-of-year recap experience.

**Build tools that enable:**

- Insights into persistent strengths and weaknesses
- Visualizations of player progress over time
- Fun, shareable year-end summaries (e.g., most-played champions, biggest improvements, highlight matches)
- Social comparisons (e.g., how you stack up against friends or which playstyles complement yours)
- Socially shareable moments and insights — creative ways for players to engage with friends on social platforms using their data

These tools should go beyond what’s available on op.gg — they must demonstrate how generative AI on AWS can turn raw gameplay data into personalized, meaningful, and enjoyable retrospectives for players of all skill levels.

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Backend**: AWS Amplify Gen 2
- **API Integration**: Riot Games API (Account v1, Match v5)

## Architecture

### Core Services

- **AWS Amplify**: Backend and data storage solution, we'll be heavily relying on this unless it does not provide.
- **Next.js Frontend**: Player search and statistics visualization

### Frontend

See [Frontend Documentation](./app/README.md)

### Analytics & Insights

#### Performance Metrics Calculation

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

### Data Flow

#### Player Lookup

1. User enters Riot ID (gameName + tagLine) and selects region in navbar search component
2. Stats shown and followed by a list of recent matches
3. Click on each list item to navigate to detailed match analysis

#### Fetching External API

See [Riot API](./types/riot/README.md)

**Rate Limiting**: Riot API has rate limits (Personal API Key: 100 requests per 2 minutes). Implementing:

- Request queuing/batching
- Response caching in DynamoDB

### AWS Bedrock AI Analysis

- Send a player's whole year match history with basic stats to the AI coach. The AI coach can identify patterns, such as performance declining after extended play sessions.
- For each match, the AI coach provides deeper timeline-based analysis, appending insights to specific timestamps.

The analysis results are added to the frontend in the `aiInsight` field.

### AWS Amplify Gen 2 Hosting

- Frontend: Next.js app hosted on Amplify
- Backend: Amplify Gen 2 backend (Lambda + DynamoDB + AppSync)
- CI/CD: Automatic deployment via `amplify.yml`

## Riot API Integration

Comprehensive TypeScript DTOs for the Riot Games API. See [`types/riot/README.md`](types/riot/README.md) for API endpoints and types.
