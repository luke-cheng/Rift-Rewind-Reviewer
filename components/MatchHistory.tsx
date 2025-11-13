"use client";

import { useState, useEffect, useRef } from "react";
import { View, Flex, Text, Button, Loader } from "@aws-amplify/ui-react";
import { client } from "@/client";
import { useRegion } from "@/context/RegionContext";
import { MatchParticipant } from "./types";
import MatchCard from "./MatchCard";
import outputs from "../amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from "aws-amplify";

Amplify.configure(outputs);

interface MatchHistoryProps {
  puuid: string;
}

function mapToMatchParticipant(item: any): MatchParticipant {
  return {
    id: item.matchId || `${item.puuid}-${item.matchId}`,
    puuid: item.puuid,
    matchId: item.matchId,
    gameCreation: item.gameCreation,
    win: item.win ?? undefined,
    kills: item.kills ?? undefined,
    deaths: item.deaths ?? undefined,
    assists: item.assists ?? undefined,
    kda: item.kda ?? undefined,
    championId: item.championId ?? undefined,
    championName: item.championName ?? undefined,
    lane: item.lane ?? undefined,
    role: item.role ?? undefined,
    teamPosition: item.teamPosition ?? undefined,
    queueId: item.queueId ?? undefined,
    gameMode: item.gameMode ?? undefined,
    totalDamageDealt: item.totalDamageDealt ?? undefined,
    totalDamageDealtToChampions: item.totalDamageDealtToChampions ?? undefined,
    totalMinionsKilled: item.totalMinionsKilled ?? undefined,
    visionScore: item.visionScore ?? undefined,
    goldEarned: item.goldEarned ?? undefined,
    goldSpent: item.goldSpent ?? undefined,
    timePlayed: item.timePlayed ?? undefined,
    totalTimeSpentDead: item.totalTimeSpentDead ?? undefined,
    teamId: item.teamId ?? undefined,
    gameDuration: item.gameDuration ?? undefined,
    processedAt: item.processedAt ?? undefined,
    aiInsights: item.aiInsights as MatchParticipant["aiInsights"],
  };
}

async function fetchMatchHistory(puuid: string): Promise<MatchParticipant[]> {
  try {
    const response = await client.models.MatchParticipantIndex.list({
      filter: { puuid: { eq: puuid } },
      limit: 100,
    });

    const { data, errors } = response;

    if (errors) {
      console.error("Error fetching match history - errors:", JSON.stringify(errors, null, 2));
      return [];
    }

    if (!data) {
      console.error("Error fetching match history - no data:", JSON.stringify(response, null, 2));
      return [];
    }

    if (!Array.isArray(data)) {
      console.error("Error fetching match history - data is not array:", JSON.stringify(data, null, 2));
      return [];
    }

    const mapped = data.map(mapToMatchParticipant);

    const sorted = mapped.sort(
      (a, b) => (b.gameCreation || 0) - (a.gameCreation || 0)
    );

    return sorted;
  } catch (error) {
    console.error("Error fetching match history:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    return [];
  }
}

async function triggerMatchProcessing(
  puuid: string,
  region: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await client.mutations.processMatches({
      puuid,
      region,
      count: 100, // Fetch full year of matches
    });

    console.error("processMatches response:", JSON.stringify(response, null, 2));

    const { data, errors } = response;

    if (errors) {
      console.error("Error in processMatches - errors:", JSON.stringify(errors, null, 2));
      
      // Handle errors - check if it's an array first
      let errorMessage = "Failed to process matches";
      if (Array.isArray(errors)) {
        errorMessage = errors.map((e: any) => {
          if (typeof e === 'object' && e !== null && 'message' in e) {
            return e.message;
          }
          return JSON.stringify(e);
        }).join(", ");
      } else if (typeof errors === 'object' && errors !== null) {
        errorMessage = JSON.stringify(errors);
      } else {
        errorMessage = String(errors);
      }
      
      throw new Error(errorMessage);
    }

    if (!data) {
      console.error("Error in processMatches - no data:", JSON.stringify(response, null, 2));
      throw new Error("No data returned from processMatches");
    }

    return { success: true, message: "Matches processed successfully" };
  } catch (error) {
    console.error("Error processing matches:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unknown error processing matches: ${JSON.stringify(error)}`);
  }
}

export default function MatchHistory({ puuid }: MatchHistoryProps) {
  const { region } = useRegion();
  const [matches, setMatches] = useState<MatchParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const hasTriggeredProcessing = useRef(false);

  useEffect(() => {
    if (!puuid) {
      return;
    }

    // Reset processing flag when puuid changes
    hasTriggeredProcessing.current = false;
    setIsLoading(true);
    setIsProcessing(false);
    setError(null);
    setProcessingError(null);

    const loadMatches = async () => {
      try {
        const data = await fetchMatchHistory(puuid);
        setMatches(data);
        setIsLoading(false);

        // Auto-trigger processing if no matches found and we haven't triggered it yet
        if (data.length === 0 && !hasTriggeredProcessing.current) {
          hasTriggeredProcessing.current = true;
          setIsProcessing(true);
          setProcessingError(null);

          try {
            await triggerMatchProcessing(puuid, region);
            // Refetch matches after processing
            const newData = await fetchMatchHistory(puuid);
            setMatches(newData);
          } catch (err) {
            console.error("Error processing matches:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
            const errorMessage =
              err instanceof Error
                ? err.message
                : `Failed to process matches from Riot API: ${JSON.stringify(err)}`;
            setProcessingError(errorMessage);
          } finally {
            setIsProcessing(false);
          }
        }
      } catch (err) {
        console.error("Error loading match history:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
        setError("Failed to load match history");
        setIsLoading(false);
      }
    };

    loadMatches();
  }, [puuid, region]);

  const handleRetryProcessing = async () => {
    if (!puuid) {
      return;
    }

    hasTriggeredProcessing.current = false;
    setProcessingError(null);
    setIsLoading(true);
    setIsProcessing(true);

    try {
      const data = await fetchMatchHistory(puuid);
      setMatches(data);
      setIsLoading(false);

      if (data.length === 0) {
        try {
          await triggerMatchProcessing(puuid, region);
          // Refetch matches after processing
          const newData = await fetchMatchHistory(puuid);
          setMatches(newData);
        } catch (err) {
          console.error("Error processing matches:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
          const errorMessage =
            err instanceof Error
              ? err.message
              : `Failed to process matches from Riot API: ${JSON.stringify(err)}`;
          setProcessingError(errorMessage);
        } finally {
          setIsProcessing(false);
        }
      } else {
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Error loading match history:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
      setError("Failed to load match history");
      setIsLoading(false);
      setIsProcessing(false);
    }
  };

  if (!puuid) {
    return (
      <View padding="large" textAlign="center">
        <Text>Please search for a player to view match history</Text>
      </View>
    );
  }

  if (isLoading && !isProcessing) {
    return (
      <View padding="large" textAlign="center">
        <Text>Loading match history...</Text>
      </View>
    );
  }

  return (
    <View maxWidth="1200px" margin="0 auto" padding="medium">
      <Flex direction="column" gap="medium">
        <Text fontSize="xl" fontWeight="bold">
          Match History
        </Text>

        {isProcessing && (
          <View padding="large" textAlign="center">
            <Flex direction="column" gap="medium" alignItems="center">
              <Loader size="large" />
              <Text>
                Fetching and processing matches from Riot API. This may take a
                moment...
              </Text>
              <Text fontSize="small" color="font.secondary">
                Processing matches from the last 365 days
              </Text>
            </Flex>
          </View>
        )}

        {processingError && !isProcessing && (
          <View padding="large" textAlign="center">
            <Flex direction="column" gap="medium" alignItems="center">
              <Text color="font.error">{processingError}</Text>
              <Button onClick={handleRetryProcessing} variation="primary">
                Retry Processing
              </Button>
            </Flex>
          </View>
        )}

        {error && !isProcessing && (
          <View padding="large" textAlign="center">
            <Text color="font.error">{error}</Text>
          </View>
        )}

        {!isProcessing &&
          !error &&
          matches.length === 0 &&
          !processingError && (
            <View padding="large" textAlign="center">
              <Text>No matches found</Text>
            </View>
          )}

        {!isProcessing && matches.length > 0 && (
          <Flex direction="column" gap="small">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </Flex>
        )}
      </Flex>
    </View>
  );
}
