import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { dataProcessorFunction } from './functions/data-processor/resource';
import { riotApiHttpFunction } from './functions/riot-api-http/resource';
import { Tags, Duration } from 'aws-cdk-lib';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
export const backend = defineBackend({
  auth,
  data,
  storage,
  dataProcessorFunction,
  riotApiHttpFunction,
});

// Grant S3 access to riotApiHttpFunction
backend.storage.resources.bucket.grantReadWrite(backend.riotApiHttpFunction.resources.lambda);

// Pass bucket name to function as environment variable using CDK
backend.riotApiHttpFunction.addEnvironment(
  'MATCH_CACHE_BUCKET_NAME',
  backend.storage.resources.bucket.bucketName
);

// Grant data layer access to dataProcessorFunction and riotApiHttpFunction
// Amplify automatically grants access and configures environment when function is used as handler in schema
// The functions use IAM authentication which is automatically configured
Object.values(backend.data.resources.tables).forEach((table) => {
  table.grantReadWriteData(backend.riotApiHttpFunction.resources.lambda);
});

// Configure S3 lifecycle policy for 1-year expiration using CDK
const bucket = backend.storage.resources.bucket.node.defaultChild;
if (bucket && 'addLifecycleRule' in bucket) {
  (bucket as any).addLifecycleRule({
    id: 'expire-after-one-year',
    expiration: Duration.days(365),
    enabled: true,
  });
}

// Tag all resources in the backend stack with the hackathon tag
Tags.of(backend.stack).add('rift-rewind-hackathon', '2025');
