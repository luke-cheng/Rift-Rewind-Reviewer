import { generateClient } from "aws-amplify/api";
import { Schema } from "../amplify/data/resource";
import { createAIHooks } from "@aws-amplify/ui-react-ai";

/**
 * Generated Amplify data client for type-safe API calls
 */
export const client = generateClient<Schema>({ authMode: "apiKey" });

/**
 * AI hooks for generating insights
 * - useAIGeneration: For single request-response AI generation
 */
export const { useAIGeneration } = createAIHooks(client);


