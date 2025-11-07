import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const bucketName = process.env.DATA_BUCKET_NAME;

/**
 * Ingest Lambda Function
 * Handles ingestion of League of Legends match data
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Ingest Lambda invoked", { event });

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
    const { matchData, playerId, matchId } = body;

    if (!matchData || !playerId || !matchId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Missing required fields: matchData, playerId, matchId",
        }),
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

    // Store match data in S3
    const key = `match-data/${playerId}/${matchId}.json`;
    const timestamp = new Date().toISOString();

    const dataToStore = {
      ...matchData,
      playerId,
      matchId,
      ingestedAt: timestamp,
    };

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: JSON.stringify(dataToStore, null, 2),
      ContentType: "application/json",
      Metadata: {
        playerId,
        matchId,
        timestamp,
      },
    });

    await s3Client.send(command);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Match data ingested successfully",
        key,
        timestamp,
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
        error: "Failed to ingest match data",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
