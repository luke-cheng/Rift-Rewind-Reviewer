import { defineFunction } from '@aws-amplify/backend';

export const dataProcessorFunction = defineFunction({
  name: 'data-processor-handler',
  entry: './handler.ts',
  timeoutSeconds: 300,
});