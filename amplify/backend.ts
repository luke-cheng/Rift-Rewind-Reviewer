import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { riotApiFunction } from './functions/riot-api/resource';
import { dataProcessorFunction } from './functions/data-processor/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
export const backend = defineBackend({
  auth,
  data,
  riotApiFunction,
  dataProcessorFunction,
});
