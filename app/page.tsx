"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import StatsDashboard from "@/components/StatsDashboard";
import MatchHistory from "@/components/MatchHistory";
import { PlayerStats } from "@/components/types";
import { View, Flex, Text } from "@aws-amplify/ui-react";

const client = generateClient<Schema>();

async function fetchPlayerStats(puuid: string): Promise<PlayerStats | null> {
  // TODO: Fetch PlayerStat by puuid
  // This should query the PlayerStat model by puuid
  // Return PlayerStats object or null if not found
  console.log("Fetching player stats for:", puuid);
  return null;
}

export default function HomePage() {
  const [selectedPuuid, setSelectedPuuid] = useState<string | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if there's a puuid in URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const puuidParam = urlParams.get("puuid");
    const storedPuuid = localStorage.getItem("selectedPuuid");

    const puuid = puuidParam || storedPuuid;
    if (puuid) {
      setSelectedPuuid(puuid);
      loadPlayerStats(puuid);
    }
  }, []);

  const loadPlayerStats = async (puuid: string) => {
    setIsLoading(true);
    try {
      const stats = await fetchPlayerStats(puuid);
      setPlayerStats(stats);
    } catch (error) {
      console.error("Error loading player stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayerSelect = (puuid: string) => {
    setSelectedPuuid(puuid);
    localStorage.setItem("selectedPuuid", puuid);
    loadPlayerStats(puuid);
  };

  return (
    <View maxWidth="1200px" margin="0 auto" width="100%">
      <Flex direction="column" gap="large">
        {selectedPuuid ? (
          <>
            <StatsDashboard stats={playerStats} isLoading={isLoading} />
            <MatchHistory puuid={selectedPuuid} />
          </>
        ) : (
          <View padding="large" textAlign="center">
            <Text fontSize="lg">Search for a player to view their stats and match history</Text>
            <Text color="font.secondary" marginTop="small">
              Enter a player name in the format: gameName#tagLine
            </Text>
          </View>
        )}
      </Flex>
    </View>
  );
}
