# Rift Rewind Reviewer - Track, Reflect, Develop

> Submission for Rift [Rift Rewind Hackathon](https://riftrewind.devpost.com/)

## Overview

A coaching service for League of Legends gameplay performance analyzer. Utilizes various AWS services to analyze player performance and provide coaching insights.

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Backend**: AWS Amplify Gen 2
- **API**: AWS AppSync (GraphQL)
- **Database**: Amazon DynamoDB
- **Compute**: AWS Lambda
- **AI/ML**: AWS Bedrock
- **API Integration**: Riot Games API (Account v1, Match v5)

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture documentation.

## Riot API Integration

Comprehensive TypeScript DTOs for the Riot Games API. See [`types/riot-api/README.md`](types/riot-api/README.md) for API endpoints and types.
