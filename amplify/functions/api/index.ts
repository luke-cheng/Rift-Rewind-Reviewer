import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";

const bedrockClient = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
});

/**
 * API Lambda Function
 * Handles API requests and orchestrates interactions with Bedrock Agent
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("API Lambda invoked", { event });

  try {
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};

    if (method === "GET") {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Rift Rewind Reviewer API",
          version: "1.0.0",
          endpoints: {
            api: "/api - Main API endpoint",
            ingest: "/ingest - Data ingestion endpoint",
            tools: "/tools - Bedrock Agent tools endpoint",
          },
        }),
      };
    }

    if (method === "POST") {
      const { query, sessionId } = body;

      if (!query) {
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({ error: "Query is required" }),
        };
      }

      // Invoke Bedrock Agent
      const agentId = process.env.BEDROCK_AGENT_ID;
      const agentAliasId = process.env.BEDROCK_AGENT_ALIAS_ID;

      if (!agentId || agentId === "TBD" || !agentAliasId || agentAliasId === "TBD") {
        // Return mock response when Bedrock Agent is not configured
        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            response: `Analysis for query: "${query}". Bedrock Agent not yet configured. This is a placeholder response.`,
            sessionId: sessionId || "mock-session",
            metadata: {
              configured: false,
              message: "Configure BEDROCK_AGENT_ID and BEDROCK_AGENT_ALIAS_ID environment variables",
            },
          }),
        };
      }

      try {
        const command = new InvokeAgentCommand({
          agentId,
          agentAliasId,
          sessionId: sessionId || crypto.randomUUID(),
          inputText: query,
        });

        const response = await bedrockClient.send(command);

        // Process streaming response
        const completion = response.completion;
        let fullResponse = "";

        if (completion) {
          for await (const event of completion) {
            if (event.chunk?.bytes) {
              const text = new TextDecoder().decode(event.chunk.bytes);
              fullResponse += text;
            }
          }
        }

        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            response: fullResponse,
            sessionId: sessionId || crypto.randomUUID(),
          }),
        };
      } catch (bedrockError) {
        console.error("Bedrock Agent error:", bedrockError);
        return {
          statusCode: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            error: "Failed to invoke Bedrock Agent",
            details: bedrockError instanceof Error ? bedrockError.message : "Unknown error",
          }),
        };
      }
    }

    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
