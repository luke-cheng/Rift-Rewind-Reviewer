import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
import { defineInfrastructure } from './infrastructure/resource.js';

const backend = defineBackend({
  auth,
  data,
});

// Add custom CDK infrastructure
const { stack } = backend.createStack("RiftRewindInfrastructure");
defineInfrastructure(stack);
