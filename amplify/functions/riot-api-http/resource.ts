import { defineFunction, secret } from '@aws-amplify/backend';

export const riotApiHttpFunction = defineFunction({
  environment: {
    RIOT_API_KEY: secret('RIOT_API_KEY'),
  },
  timeoutSeconds: 30,
});

