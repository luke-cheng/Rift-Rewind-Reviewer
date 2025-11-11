import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { dataProcessorFunction } from './functions/data-processor/resource';
import { riotApiHttpFunction } from './functions/riot-api-http/resource';
import { Tags } from 'aws-cdk-lib';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
export const backend = defineBackend({
  auth,
  data,
  dataProcessorFunction,
  riotApiHttpFunction,
});

// Tag all resources in the backend stack with the hackathon tag
Tags.of(backend.stack).add('rift-rewind-hackathon', '2025');
