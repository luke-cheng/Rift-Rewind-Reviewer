# Rift Rewind Reviewer: Track, Reflect, Depart

Personalized League of Legends insights powered by AWS AI services.

## Overview

Rift Rewind Reviewer is a serverless application that analyzes your League of Legends match history and provides AI-powered insights to help you improve your gameplay. Built with Next.js and AWS services, it leverages Amazon Bedrock Agent for intelligent analysis.

## Architecture

**Serverless Architecture** using Next.js frontend and AWS CDK for infrastructure:

- **Frontend**: Next.js with AWS Amplify hosting
- **Storage**: Amazon S3 for match data
- **Compute**: 3 AWS Lambda functions (API, Ingest, Tools)
- **API**: Amazon API Gateway (REST)
- **AI/ML**: Amazon Bedrock Agent (Orchestrator)
- **Auth**: Amazon Cognito

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Features

- **AI-Powered Insights**: Natural language queries about your LoL performance
- **Match Data Ingestion**: Store and organize match history
- **Personalized Analysis**: Tailored recommendations based on your playstyle
- **Serverless Scalability**: Automatic scaling with AWS Lambda
- **Authentication**: Secure user authentication with Amazon Cognito

## Deploying to AWS

For detailed instructions on deploying your application, refer to the [deployment section](https://docs.amplify.aws/nextjs/start/quickstart/nextjs-app-router-client-components/#deploy-a-fullstack-app-to-aws) of our documentation.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.