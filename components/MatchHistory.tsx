"use client";

import { useState, useEffect } from "react";
import { View, Flex, Text, SelectField } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { MatchParticipant } from "./types";
import MatchCard from "./MatchCard";

const client = generateClient<Schema>();

interface MatchHistoryProps {
  puuid: string;
  year?: number;
}

async function fetchMatchHistory(puuid: string, year?: number): Promise<MatchParticipant[]> {
  try {
    // Calculate timestamp range for the year if provided
    const startTime = year ? new Date(`${year}-01-01`).getTime() : undefined;
    const endTime = year ? new Date(`${year + 1}-01-01`).getTime() : undefined;

    // Query MatchParticipantIndex model filtered by puuid using Amplify Gen 2 client
    // Using the secondary index on puuid with sortKeys on gameCreation
    const filter: any = {
      puuid: { eq: puuid },
    };

    // Add year filter if provided (filter by gameCreation timestamp)
    if (startTime && endTime) {
      filter.gameCreation = {
        ge: Math.floor(startTime),
        lt: Math.floor(endTime),
      };
    }

    const { data, errors } = await client.models.MatchParticipantIndex.list({
      filter,
      limit: 100, // Adjust limit as needed
    });

    if (errors || !data) {
      console.error("Error fetching match history:", errors);
      return [];
    }

    // Map the data to MatchParticipant interface
    return data.map((item) => ({
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
    }));
  } catch (error) {
    console.error("Error fetching match history:", error);
    return [];
  }
}

export default function MatchHistory({ puuid, year }: MatchHistoryProps) {
  const [matches, setMatches] = useState<MatchParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(year || new Date().getFullYear());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!puuid) return;

    setIsLoading(true);
    setError(null);

    fetchMatchHistory(puuid, selectedYear)
      .then((data) => {
        setMatches(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching match history:", err);
        setError("Failed to load match history");
        setIsLoading(false);
      });
  }, [puuid, selectedYear]);

  // Generate year options (current year and past few years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

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
        <Flex direction="row" justifyContent="space-between" alignItems="center">
          <Text fontSize="xl" fontWeight="bold">
            Match History
          </Text>
          <SelectField
            label="Year"
            labelHidden
            value={selectedYear.toString()}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </SelectField>
        </Flex>

        {matches.length === 0 ? (
          <View padding="large" textAlign="center">
            <Text>No matches found for this year</Text>
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

