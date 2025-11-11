"use client";

import { useState, useEffect } from "react";
import { View, Flex, Text } from "@aws-amplify/ui-react";
import { client } from "@/app/client";
import { MatchParticipant } from "./types";
import MatchCard from "./MatchCard";
import { useToast } from "@/context/ToastContext";

interface MatchHistoryProps {
  puuid: string;
}

async function fetchMatchHistory(puuid: string): Promise<MatchParticipant[]> {
  try {
    // Query MatchParticipantIndex model filtered by puuid using Amplify Gen 2 client
    // Using the secondary index on puuid with sortKeys on gameCreation
    const filter: any = {
      puuid: { eq: puuid },
    };

    const { data, errors } = await client.models.MatchParticipantIndex.list({
      filter,
      limit: 100, // Adjust limit as needed
    });

    if (errors || !data) {
      return [];
    }

    // Map the data to MatchParticipant interface and sort by gameCreation (reverse chronological - newest first)
    return data
      .map((item) => ({
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
      aiInsights: item.aiInsights as MatchParticipant['aiInsights'],
    }))
      .sort((a, b) => (b.gameCreation || 0) - (a.gameCreation || 0)); // Sort reverse chronological (newest first)
  } catch {
    return [];
  }
}

export default function MatchHistory({ puuid }: MatchHistoryProps) {
  const [matches, setMatches] = useState<MatchParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { error: showError } = useToast();

  useEffect(() => {
    if (!puuid) return;

    setIsLoading(true);
    setError(null);

    fetchMatchHistory(puuid)
      .then((data) => {
        setMatches(data);
        setIsLoading(false);
        // MatchCard components will automatically generate AI insights for matches that don't have them
      })
      .catch(() => {
        setError("Failed to load match history");
        showError("Failed to load match history");
        setIsLoading(false);
      });
  }, [puuid, showError]);

  if (!puuid) {
    return (
      <View padding="large" textAlign="center">
        <Text>Please search for a player to view match history</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View padding="large" textAlign="center">
        <Text>Loading match history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View padding="large" textAlign="center">
        <Text color="font.error">{error}</Text>
      </View>
    );
  }

  return (
    <View maxWidth="1200px" margin="0 auto" padding="medium">
      <Flex direction="column" gap="medium">
        <Text fontSize="xl" fontWeight="bold">
          Match History
        </Text>

        {matches.length === 0 ? (
          <View padding="large" textAlign="center">
            <Text>No matches found</Text>
          </View>
        ) : (
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

