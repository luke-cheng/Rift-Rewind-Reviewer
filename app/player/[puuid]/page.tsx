"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { PlayerStats } from "@/components/types";
import StatsDashboard from "@/components/StatsDashboard";
import MatchHistory from "@/components/MatchHistory";
import { View, Text, Card, Flex } from "@aws-amplify/ui-react";

const client = generateClient<Schema>();

async function fetchPlayerStats(puuid: string): Promise<PlayerStats | null> {
  // TODO: Fetch PlayerStat by puuid
  // This should query the PlayerStat model by puuid
  // Return PlayerStats object or null if not found
  console.log("Fetching player stats for:", puuid);
  return null;
}

export default function PlayerPage() {
  const params = useParams();
  const puuid = params?.puuid as string;
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!puuid) return;

    setIsLoading(true);
    setError(null);

    fetchPlayerStats(puuid)
      .then((data) => {
        setPlayerStats(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching player stats:", err);
        setError("Failed to load player stats");
        setIsLoading(false);
      });
  }, [puuid]);

  if (isLoading) {
    return (
      <View padding="large" textAlign="center">
        <Text>Loading player stats...</Text>
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
    <View maxWidth="1200px" margin="0 auto" width="100%">
      <Flex direction="column" gap="large">
        <StatsDashboard stats={playerStats} isLoading={isLoading} />
        {puuid && <MatchHistory puuid={puuid} />}
      </Flex>
    </View>
  );
}

