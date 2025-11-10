"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { client } from "@/app/client";
import { PlayerStats } from "@/components/types";
import StatsDashboard from "@/components/StatsDashboard";
import MatchHistory from "@/components/MatchHistory";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { View, Text, Flex, Loader } from "@aws-amplify/ui-react";
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

async function checkIfMatchesExist(puuid: string): Promise<boolean> {
  try {
    const { data, errors } = await client.models.MatchParticipantIndex.list({
      filter: { puuid: { eq: puuid } },
      limit: 1,
    });
    return !errors && data && data.length > 0;
  } catch {
    return false;
  }
}

async function processPlayerMatches(puuid: string): Promise<{ success: boolean; error?: any }> {
  try {
    const { data, errors } = await client.mutations.processMatches({
      puuid,
      count: 20,
    });
    
    // Check for GraphQL errors
    if (errors) {
      console.error('GraphQL errors in processMatches:', JSON.stringify(errors, null, 2));
      return { success: false, error: { errors } };
    }
    
    // Check if the response indicates an error (wrapped error from handler)
    if (data && typeof data === 'object' && 'success' in data) {
      if ((data as any).success === false) {
        console.error('Error response from processMatches:', JSON.stringify(data, null, 2));
        return { success: false, error: (data as any).error };
      }
      return { success: true };
    }
    
    // If no errors and no explicit success field, consider it successful
    return { success: true };
  } catch (error) {
    console.error("Unexpected error processing matches:", JSON.stringify(error, null, 2));
    return { 
      success: false, 
      error: { 
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'UNEXPECTED_ERROR'
      } 
    };
  }
}

export default function PlayerPage() {
  const params = useParams();
  const router = useRouter();
  const puuid = params?.puuid as string;
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { error: showError, success: showSuccess } = useToast();

  useEffect(() => {
    if (!puuid) return;

    const loadPlayerData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Check if matches exist for this player
        const matchesExist = await checkIfMatchesExist(puuid);
        
        // If no matches exist, process them
        if (!matchesExist) {
          setIsProcessing(true);
          showSuccess("Fetching match data...");
          
          const result = await processPlayerMatches(puuid);
          
          if (!result.success) {
            // Error response is already logged in processPlayerMatches
            const errorMessage = result.error?.message || "Failed to fetch match data. Please try again.";
            showError(errorMessage);
            setIsProcessing(false);
            setIsLoading(false);
            return;
          }
          
          showSuccess("Match data fetched successfully!");
        }

        // Fetch player stats
        const stats = await fetchPlayerStats(puuid);
        
        if (!stats && !matchesExist) {
          // Stats might not be available yet if processing just started
          // Wait a bit and try again, or show loading state
          setError("Processing player data. Please refresh in a moment.");
        } else {
          setPlayerStats(stats);
        }
      } catch (err) {
        setError("Failed to load player data");
        showError("Failed to load player data");
      } finally {
        setIsLoading(false);
        setIsProcessing(false);
      }
    };

    loadPlayerData();
  }, [puuid, showError, showSuccess]);

  const handlePlayerSelect = (newPuuid: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedPuuid", newPuuid);
    }
    router.push(`/player/${newPuuid}`);
  };

  if (isLoading || isProcessing) {
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
              <Flex direction="column" gap="medium" alignItems="center">
                <Loader size="large" />
                <Text>
                  {isProcessing 
                    ? "Fetching and processing match data..." 
                    : "Loading player stats..."}
                </Text>
              </Flex>
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

