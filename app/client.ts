import { generateClient } from "aws-amplify/api";
import { Schema } from "@/amplify/data/resource";
import { createAIHooks } from "@aws-amplify/ui-react-ai";

// Generate client with explicit apiKey auth mode
export const client = generateClient<Schema>({
  authMode: 'apiKey'
});
export const { useAIConversation, useAIGeneration } = createAIHooks(client);