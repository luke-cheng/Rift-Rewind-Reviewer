import { generateClient } from "aws-amplify/api";
import { Schema } from "@/amplify/data/resource";
import { createAIHooks } from "@aws-amplify/ui-react-ai";

// Generate client - using default authMode (apiKey) since routes use guest access
export const client = generateClient<Schema>();
export const { useAIConversation, useAIGeneration } = createAIHooks(client);