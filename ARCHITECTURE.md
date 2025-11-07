# Rift Rewind Reviewer - Architecture Documentation

## Overview

Rift Rewind Reviewer is a serverless application that provides personalized League of Legends insights using AWS AI services. The architecture leverages AWS Amplify Gen 2 and AWS CDK for infrastructure as code.

## Architecture Components

### Frontend
- **Next.js (App Router)**: Modern React framework for the web interface
- **AWS Amplify**: Provides authentication and hosting capabilities

### Backend Services

#### 1. S3 Data Storage
- **Purpose**: Store League of Legends match data
- **Features**:
  - Versioning enabled for data integrity
  - Server-side encryption (S3 managed)
  - Block all public access
  - Organized structure: `match-data/{playerId}/{matchId}.json`

#### 2. API Gateway REST API
- **Purpose**: Central API for all client interactions
- **Endpoints**:
  - `GET /api` - API information and health check
  - `POST /api` - Query Bedrock Agent for insights
  - `POST /ingest` - Ingest match data
  - `POST /tools` - Bedrock Agent tool actions
- **Features**:
  - CORS enabled for web clients
  - Integrated with Lambda functions

#### 3. Lambda Functions

##### API Lambda (`/api`)
- **Runtime**: Node.js 20.x
- **Purpose**: Orchestrate interactions with Amazon Bedrock Agent
- **Responsibilities**:
  - Accept user queries
  - Invoke Bedrock Agent for AI-powered insights
  - Stream responses back to clients
  - Session management
- **Environment Variables**:
  - `DATA_BUCKET_NAME`: S3 bucket for data storage
  - `BEDROCK_AGENT_ID`: Amazon Bedrock Agent identifier
  - `BEDROCK_AGENT_ALIAS_ID`: Bedrock Agent alias identifier

##### Ingest Lambda (`/ingest`)
- **Runtime**: Node.js 20.x
- **Purpose**: Handle data ingestion from Riot Games API
- **Responsibilities**:
  - Validate incoming match data
  - Store match data in S3
  - Add metadata and timestamps
- **Environment Variables**:
  - `DATA_BUCKET_NAME`: S3 bucket for data storage

##### Tools Lambda (`/tools`)
- **Runtime**: Node.js 20.x
- **Purpose**: Provide data retrieval tools for Bedrock Agent
- **Responsibilities**:
  - Retrieve player match history
  - Fetch specific match details
  - Calculate player statistics
- **Actions**:
  - `getPlayerMatches`: List all matches for a player
  - `getMatchDetails`: Get detailed match data
  - `getPlayerStats`: Calculate aggregate player statistics
- **Environment Variables**:
  - `DATA_BUCKET_NAME`: S3 bucket for data storage

#### 4. Amazon Bedrock Agent (Orchestrator)
- **Purpose**: AI-powered insights and natural language understanding
- **Features**:
  - Interprets user queries about LoL performance
  - Calls Tools Lambda to retrieve relevant data
  - Generates personalized insights and recommendations
  - Maintains conversation context

### IAM Roles and Permissions

#### Lambda Execution Role
- Basic Lambda execution permissions
- S3 read/write access to data bucket
- Bedrock Agent invocation permissions:
  - `bedrock:InvokeAgent`
  - `bedrock:InvokeModel`
  - `bedrock:GetAgent`
  - `bedrock:ListAgents`

## Data Flow

### Match Data Ingestion
1. Client sends match data to `/ingest` endpoint
2. API Gateway routes to Ingest Lambda
3. Lambda validates and stores data in S3
4. Returns confirmation to client

### Insight Query
1. User submits query to `/api` endpoint
2. API Lambda receives query
3. Lambda invokes Bedrock Agent with query
4. Bedrock Agent:
   - Analyzes query intent
   - Calls Tools Lambda for data (if needed)
   - Generates insights using AI model
5. Response streamed back through API Lambda
6. Client displays insights to user

### Tool Invocation (by Bedrock Agent)
1. Bedrock Agent determines data needed
2. Calls `/tools` endpoint with action and parameters
3. Tools Lambda:
   - Retrieves data from S3
   - Processes and formats data
   - Returns to Bedrock Agent
4. Bedrock Agent incorporates data into response

## Deployment

### Prerequisites
- AWS Account
- AWS Amplify CLI configured
- Node.js 20.x or later

### Setup Steps
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure AWS Amplify: `npx ampx sandbox`
4. Deploy infrastructure: Stack is deployed automatically via Amplify

### Configuration
After deployment, configure Bedrock Agent:
1. Create a Bedrock Agent in AWS Console
2. Configure agent with Tools Lambda function
3. Update Lambda environment variables with Agent ID and Alias ID

## Security Considerations

- All S3 buckets have public access blocked
- Lambda functions use least-privilege IAM roles
- API Gateway endpoints support authentication (to be configured)
- Data encryption at rest (S3) and in transit (HTTPS)

## Technology Stack

- **Frontend**: Next.js 14, React 18, AWS Amplify UI
- **Backend**: AWS Lambda (Node.js 20.x)
- **Infrastructure**: AWS CDK, AWS Amplify Gen 2
- **AI/ML**: Amazon Bedrock Agent
- **Storage**: Amazon S3
- **API**: Amazon API Gateway (REST)
- **Auth**: Amazon Cognito (via Amplify)

## Future Enhancements

- Real-time match data streaming
- Historical trend analysis
- Champion-specific insights
- Team composition recommendations
- Integration with Riot Games API for automatic data ingestion
- Advanced analytics and visualizations
