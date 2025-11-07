# Deployment Guide - Rift Rewind Reviewer

This guide walks you through deploying the Rift Rewind Reviewer application to AWS.

## Prerequisites

Before deploying, ensure you have:

1. **AWS Account**: An active AWS account with appropriate permissions
2. **AWS CLI**: Installed and configured with your credentials
   ```bash
   aws configure
   ```
3. **Node.js**: Version 20.x or later
   ```bash
   node --version
   ```
4. **AWS Amplify CLI**: Gen 2 CLI tools
   ```bash
   npm install -g @aws-amplify/cli
   ```

## Deployment Steps

### 1. Clone and Setup

```bash
git clone https://github.com/luke-cheng/Rift-Rewind-Reviewer.git
cd Rift-Rewind-Reviewer
npm install
```

### 2. Install Lambda Dependencies

```bash
cd amplify/functions/api && npm install && cd ../../..
cd amplify/functions/ingest && npm install && cd ../../..
cd amplify/functions/tools && npm install && cd ../../..
```

### 3. Deploy to AWS Amplify Sandbox

For development and testing:

```bash
npx ampx sandbox
```

This will:
- Deploy the Next.js frontend to Amplify Hosting
- Create AWS Cognito user pool for authentication
- Deploy the CDK infrastructure stack including:
  - S3 bucket for data storage
  - API Gateway REST API
  - Three Lambda functions (API, Ingest, Tools)
  - IAM roles and permissions

### 4. Deploy to Production

For production deployment:

```bash
# First, push your code to GitHub
git add .
git commit -m "Ready for production"
git push

# Then deploy via Amplify Console
# Or use the Amplify CLI:
npx ampx pipeline-deploy --branch main --app-id <your-app-id>
```

### 5. Configure Amazon Bedrock Agent

After initial deployment, you need to configure the Bedrock Agent:

#### 5.1 Create Bedrock Agent

1. Open AWS Console and navigate to Amazon Bedrock
2. Go to "Agents" section
3. Click "Create Agent"
4. Configure:
   - **Name**: Rift Rewind Reviewer Agent
   - **Description**: AI agent for analyzing League of Legends match data
   - **Model**: Select a foundation model (e.g., Claude 3 Sonnet)
   - **Instructions**: Add agent instructions (see below)

#### 5.2 Agent Instructions Template

```
You are an expert League of Legends analyst helping players improve their gameplay.
Your role is to analyze match data and provide personalized insights and recommendations.

You have access to the following tools:
- getPlayerMatches: Retrieve all matches for a player
- getMatchDetails: Get detailed information about a specific match
- getPlayerStats: Calculate aggregate statistics for a player

When analyzing matches, focus on:
1. Performance metrics (KDA, CS, damage, vision score)
2. Champion-specific insights
3. Trends over multiple games
4. Actionable recommendations for improvement

Be encouraging, constructive, and specific in your feedback.
```

#### 5.3 Configure Action Group

1. In the Bedrock Agent, create an Action Group
2. Configure:
   - **Name**: PlayerDataTools
   - **Description**: Tools for retrieving player and match data
   - **Action Group Type**: Define with API schemas
   - **Lambda Function**: Select the deployed Tools Lambda function

3. Add the OpenAPI schema for the tools (example):

```yaml
openapi: 3.0.0
info:
  title: Player Data Tools
  version: 1.0.0
paths:
  /tools:
    post:
      summary: Execute tool actions
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                action:
                  type: string
                  enum: [getPlayerMatches, getMatchDetails, getPlayerStats]
                parameters:
                  type: object
      responses:
        '200':
          description: Successful response
```

4. Save and create a new Alias for the agent

#### 5.4 Update Lambda Environment Variables

Get your Bedrock Agent ID and Alias ID, then update the API Lambda:

```bash
# Via AWS Console:
# 1. Go to Lambda console
# 2. Find the API Lambda function
# 3. Update environment variables:
#    - BEDROCK_AGENT_ID: your-agent-id
#    - BEDROCK_AGENT_ALIAS_ID: your-alias-id

# Or via AWS CLI:
aws lambda update-function-configuration \
  --function-name <api-lambda-name> \
  --environment Variables={BEDROCK_AGENT_ID=your-agent-id,BEDROCK_AGENT_ALIAS_ID=your-alias-id}
```

### 6. Test the Deployment

#### Test API Endpoint

```bash
# Get your API Gateway URL from the Amplify outputs
API_URL="https://your-api-id.execute-api.region.amazonaws.com/prod"

# Test health check
curl $API_URL/api

# Test with a query (requires authentication if configured)
curl -X POST $API_URL/api \
  -H "Content-Type: application/json" \
  -d '{"query": "What champions should I focus on?", "sessionId": "test-123"}'
```

#### Test Ingest Endpoint

```bash
curl -X POST $API_URL/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": "NA1_test_123",
    "playerId": "test-player",
    "matchData": {
      "gameMode": "CLASSIC",
      "champion": "Ahri",
      "kills": 5,
      "deaths": 3,
      "assists": 12
    }
  }'
```

## Monitoring and Logging

### CloudWatch Logs

Monitor Lambda function logs:

```bash
# View API Lambda logs
aws logs tail /aws/lambda/<api-lambda-name> --follow

# View Ingest Lambda logs
aws logs tail /aws/lambda/<ingest-lambda-name> --follow

# View Tools Lambda logs
aws logs tail /aws/lambda/<tools-lambda-name> --follow
```

### S3 Data

Check ingested data:

```bash
aws s3 ls s3://rift-rewind-data-<account-id>/match-data/ --recursive
```

## Cleanup

To remove all deployed resources:

```bash
# Delete the Amplify sandbox
npx ampx sandbox delete

# Or delete via CloudFormation
aws cloudformation delete-stack --stack-name <stack-name>
```

## Troubleshooting

### Lambda Function Errors

- Check CloudWatch Logs for detailed error messages
- Verify environment variables are set correctly
- Ensure IAM roles have necessary permissions

### Bedrock Agent Not Responding

- Verify agent is in "Ready" state
- Check agent alias is properly configured
- Ensure Lambda function has Bedrock permissions
- Verify Tools Lambda is properly linked to action group

### S3 Access Denied

- Check bucket policies
- Verify Lambda IAM role has S3 permissions
- Ensure bucket name matches environment variable

## Additional Resources

- [AWS Amplify Gen 2 Documentation](https://docs.amplify.aws/gen2/)
- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Project Architecture](./ARCHITECTURE.md)

## Support

For issues or questions:
- Open an issue on GitHub
- Check the [Architecture Documentation](./ARCHITECTURE.md)
- Review AWS CloudWatch logs for detailed error information
