import { defineStorage } from '@aws-amplify/backend';

/**
 * S3 bucket for caching immutable match data from Riot API
 * - Matches are cached with 1-year expiration
 * - Keys: matches/{matchId}.json and timelines/{matchId}.json
 */
export const storage = defineStorage({
  name: 'match-cache-bucket',
  access: (allow) => ({
    'matches/*': [
      allow.authenticated.to(['read', 'write']),
      allow.guest.to(['read', 'write']),
    ],
    'timelines/*': [
      allow.authenticated.to(['read', 'write']),
      allow.guest.to(['read', 'write']),
    ],
  }),
});

