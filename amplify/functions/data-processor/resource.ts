import { defineFunction, secret } from '@aws-amplify/backend';

export const dataProcessorFunction = defineFunction({
  name: 'data-processor-handler',
  entry: './handler.ts',
  environment: {
    RIOT_API_KEY: secret('RIOT_API_KEY'),
  },
  timeoutSeconds: 300,
});