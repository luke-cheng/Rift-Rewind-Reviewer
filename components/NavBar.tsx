"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { View, Flex, Text } from "@aws-amplify/ui-react";
import PlayerSearch from "./PlayerSearch";

interface NavBarProps {
  onPlayerSelect?: (puuid: string) => void;
}

async function searchPlayer(gameName: string, tagLine: string): Promise<string | null> {
  // TODO: Search player by Riot ID
  // This should call the Riot API or backend to get the PUUID
  // Steps:
  // 1. Call Riot API /riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}
  // 2. Extract PUUID from response
  // 3. Optionally cache the result in AccountCache or PlayerStat
  // Return the PUUID if found, null otherwise
  console.log("Searching for player:", gameName, tagLine);
  return null;
}

export default function NavBar({ onPlayerSelect }: NavBarProps) {
  const router = useRouter();
  const [isSearching, setIsSearching] = React.useState(false);

  const handleSearch = async (gameName: string, tagLine: string) => {
    setIsSearching(true);
    try {
      const puuid = await searchPlayer(gameName, tagLine);
      if (puuid) {
        if (onPlayerSelect) {
          onPlayerSelect(puuid);
        }
        router.push(`/player/${puuid}`);
      } else {
        alert("Player not found. Please check the game name and tag line.");
      }
    } catch (error) {
      console.error("Error searching for player:", error);
      alert("Error searching for player. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <View
      as="nav"
      backgroundColor="background.primary"
      padding="medium"
      borderBottom="1px solid"
      borderColor="border.primary"
    >
      <Flex
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        maxWidth="1200px"
        margin="0 auto"
        wrap="wrap"
        gap="medium"
      >
        <Text
          as="a"
          href="/"
          fontSize="xl"
          fontWeight="bold"
          textDecoration="none"
          color="font.primary"
        >
          Rift Rewind Reviewer
        </Text>
        <View flex="1" minWidth="300px" maxWidth="500px">
          <PlayerSearch onSearch={handleSearch} isLoading={isSearching} />
        </View>
      </Flex>
    </View>
  );
}

