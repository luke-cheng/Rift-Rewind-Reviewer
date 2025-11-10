"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { client } from "@/app/client";
import { PlayerStats } from "@/components/types";
import StatsDashboard from "@/components/StatsDashboard";
import MatchHistory from "@/components/MatchHistory";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { View, Text, Flex } from "@aws-amplify/ui-react";
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

export default function PlayerPage() {
  const params = useParams();
  const router = useRouter();
  const puuid = params?.puuid as string;
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { error: showError } = useToast();

  useEffect(() => {
    if (!puuid) return;

    setIsLoading(true);
    setError(null);

    fetchPlayerStats(puuid)
      .then((data) => {
        if (!data) {
          setError("Failed to load player stats");
          showError("Failed to load player stats");
        }
        setPlayerStats(data);
        setIsLoading(false);
      })
      .catch(() => {
        setError("Failed to load player stats");
        showError("Failed to load player stats");
        setIsLoading(false);
      });
  }, [puuid, showError]);

  const handlePlayerSelect = (newPuuid: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedPuuid", newPuuid);
    }
    router.push(`/player/${newPuuid}`);
  };

  if (isLoading) {
    return (
      <View width="100%" minHeight="100vh" backgroundColor="background.primary">
        <Flex direction="column" minHeight="100vh">
          <NavBar onPlayerSelect={handlePlayerSelect} />
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
            <View padding="large" textAlign="center">
              <Text>Loading player stats...</Text>
            </View>
          </View>
          <Footer />
        </Flex>
      </View>
    );
  }

  if (error) {
    return (
      <View width="100%" minHeight="100vh" backgroundColor="background.primary">
        <Flex direction="column" minHeight="100vh">
          <NavBar onPlayerSelect={handlePlayerSelect} />
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
            <View padding="large" textAlign="center">
              <Text color="font.error">{error}</Text>
            </View>
          </View>
          <Footer />
        </Flex>
      </View>
    );
  }

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
            <StatsDashboard stats={playerStats} isLoading={isLoading} />
            {puuid && <MatchHistory puuid={puuid} />}
          </Flex>
        </View>

        {/* Footer */}
        <Footer />
      </Flex>
    </View>
  );
}

