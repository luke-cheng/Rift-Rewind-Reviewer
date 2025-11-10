import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
import { riotApiFunction } from './functions/riot-api/resource.js';
import { dataProcessorFunction } from './functions/data-processor/resource.js';

// Define backend with all resources
// Note: The data processor function will access the Data API via GraphQL
// Environment variables for the API endpoint and credentials should be configured
// in the function resource or through Amplify's automatic injection
const backend = defineBackend({
  auth,
  data,
  riotApiFunction,
  dataProcessorFunction,
});

// Grant data processor function access to the Data API
// In Amplify Gen 2, functions can access data resources through their GraphQL API
// The function handler uses environment variables to connect to the API
// Note: For production, ensure the function has proper IAM permissions to invoke AppSync




