import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { S3Client, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const bucketName = process.env.DATA_BUCKET_NAME;

/**
 * Tools Lambda Function
 * Provides tools/actions for the Bedrock Agent to retrieve player data
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Tools Lambda invoked", { event });

  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const { action, parameters } = body;

    if (!action) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Action is required" }),
      };
    }

    if (!bucketName) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "DATA_BUCKET_NAME environment variable not set",
        }),
      };
    }

    let result;

    switch (action) {
      case "getPlayerMatches":
        result = await getPlayerMatches(parameters?.playerId);
        break;

      case "getMatchDetails":
        result = await getMatchDetails(
          parameters?.playerId,
          parameters?.matchId
        );
        break;

      case "getPlayerStats":
        result = await getPlayerStats(parameters?.playerId);
        break;

      default:
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            error: `Unknown action: ${action}`,
            availableActions: [
              "getPlayerMatches",
              "getMatchDetails",
              "getPlayerStats",
            ],
          }),
        };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        action,
        result,
      }),
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
        error: "Failed to execute tool action",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};

async function getPlayerMatches(playerId: string) {
  if (!playerId) {
    throw new Error("playerId is required");
  }

  const prefix = `match-data/${playerId}/`;
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
    MaxKeys: 100,
  });

  const response = await s3Client.send(command);

  return {
    playerId,
    matchCount: response.KeyCount || 0,
    matches: response.Contents?.map((obj) => ({
      key: obj.Key,
      lastModified: obj.LastModified,
      size: obj.Size,
    })) || [],
  };
}

async function getMatchDetails(playerId: string, matchId: string) {
  if (!playerId || !matchId) {
    throw new Error("playerId and matchId are required");
  }

  const key = `match-data/${playerId}/${matchId}.json`;
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await s3Client.send(command);
  const data = await response.Body?.transformToString();

  return data ? JSON.parse(data) : null;
}

async function getPlayerStats(playerId: string) {
  if (!playerId) {
    throw new Error("playerId is required");
  }

  // Get all matches for the player
  const matches = await getPlayerMatches(playerId);

  // Calculate basic stats (this is a simplified version)
  return {
    playerId,
    totalMatches: matches.matchCount,
    message: "Stats calculation logic to be implemented based on match data structure",
  };
}
