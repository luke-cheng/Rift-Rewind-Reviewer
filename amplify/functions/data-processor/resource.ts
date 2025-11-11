import { defineFunction } from '@aws-amplify/backend';

export const dataProcessorFunction = defineFunction({
  timeoutSeconds: 300,
});