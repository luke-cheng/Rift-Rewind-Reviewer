import { defineFunction, secret } from '@aws-amplify/backend';

export const riotApiFunction = defineFunction({
  name: 'riotApiFunction',
  entry: './handler.ts',
  environment: {
    RIOT_API_KEY: secret('RIOT_API_KEY'),
  },
  timeoutSeconds: 30,
});