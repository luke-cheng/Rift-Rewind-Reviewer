"use client";

import { useState, useEffect } from "react";
import { client } from "@/app/client";
import StatsDashboard from "@/components/StatsDashboard";
import MatchHistory from "@/components/MatchHistory";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { PlayerStats } from "@/components/types";
import { View, Flex, Text } from "@aws-amplify/ui-react";
import { useToast } from "@/context/ToastContext";

async function fetchPlayerStats(puuid: string): Promise<PlayerStats | null> {
  try {
    // Query PlayerStat model by puuid using Amplify Gen 2 client
    const { data, errors } = await client.models.PlayerStat.get({
      puuid,
    });

    if (errors || !data) {
      return null;
    }

    // Map the data to PlayerStats interface
    return {
      puuid: data.puuid,
      riotId: data.riotId as { gameName: string; tagLine: string } | undefined,
      totalMatches: data.totalMatches ?? undefined,
      wins: data.wins ?? undefined,
      losses: data.losses ?? undefined,
      winRate: data.winRate ?? undefined,
      avgKDA: data.avgKDA as { kills: number; deaths: number; assists: number; ratio: number } | undefined,
      avgCS: data.avgCS ?? undefined,
      avgDamage: data.avgDamage ?? undefined,
      avgVisionScore: data.avgVisionScore ?? undefined,
      championStats: data.championStats as PlayerStats['championStats'],
      roleStats: data.roleStats as PlayerStats['roleStats'],
      lastUpdated: data.lastUpdated ?? undefined,
      lastMatchFetched: data.lastMatchFetched ?? undefined,
      aiInsights: data.aiInsights as PlayerStats['aiInsights'],
    };
  } catch {
    return null;
  }
}

export default function HomePage() {
  const [selectedPuuid, setSelectedPuuid] = useState<string | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { error: showError } = useToast();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPlayerStats = async (puuid: string) => {
    setIsLoading(true);
    try {
      const stats = await fetchPlayerStats(puuid);
      if (!stats) {
        showError("Failed to load player stats. Please try again.");
      }
      setPlayerStats(stats);
    } catch {
      showError("Failed to load player stats. Please try again.");
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
    <View width="100%" minHeight="100vh" backgroundColor="background.primary">
      <Flex direction="column" minHeight="100vh">
        {/* NavBar */}
        <NavBar onPlayerSelect={handlePlayerSelect} />

        {/* Main content */}
        <View
          flex="1"
          width="100%"
          maxWidth="1200px"
          margin="0 auto"
          paddingLeft={{ base: "medium", large: "large" }}
          paddingRight={{ base: "medium", large: "large" }}
          paddingTop="large"
          paddingBottom="large"
        >
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

        {/* Footer */}
        <Footer />
      </Flex>
    </View>
  );
}
