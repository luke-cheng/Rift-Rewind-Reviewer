import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
import { riotApiFunction } from './functions/riot-api/resource.js';
import { dataProcessorFunction } from './functions/data-processor/resource.js';

const backend = defineBackend({
  auth,
  data,
  riotApiFunction,
  dataProcessorFunction,
});

backend.riotApiFunction.addEnvironment('DATA_GRAPHQL_ENDPOINT', backend.data.graphqlEndpoint);
backend.dataProcessorFunction.addEnvironment('DATA_GRAPHQL_ENDPOINT', backend.data.graphqlEndpoint);




