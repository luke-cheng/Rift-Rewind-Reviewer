import { defineFunction, secret } from '@aws-amplify/backend';

export const dataProcessorFunction = defineFunction({
  name: 'dataProcessorFunction',
  entry: './handler.ts',
  environment: {
    RIOT_API_KEY: secret('RIOT_API_KEY'),
  },
  timeoutSeconds: 300,
});