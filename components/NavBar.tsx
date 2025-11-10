"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { View, Flex, Text } from "@aws-amplify/ui-react";
import { client } from "@/app/client";
import PlayerSearch from "./PlayerSearch";

interface NavBarProps {
  onPlayerSelect?: (puuid: string) => void;
}

async function searchPlayer(gameName: string, tagLine: string): Promise<string | null> {
  try {
    // Call the searchPlayer query through Amplify Gen 2
    const { data, errors } = await client.queries.searchPlayer({
      gameName,
      tagLine,
    });

    if (errors || !data) {
      console.error("Error searching for player:", errors);
      return null;
    }

    // The searchPlayer query should return an object with puuid
    // Based on the schema, it returns a.json(), so we need to parse it
    if (typeof data === 'object' && data !== null && 'puuid' in data) {
      return (data as { puuid: string }).puuid;
    }

    // If data is a string, try to parse it
    if (typeof data === 'string') {
      const parsed = JSON.parse(data);
      return parsed.puuid || null;
    }

    return null;
  } catch (error) {
    console.error("Error searching for player:", error);
    return null;
  }
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
      style={{ borderBottom: "1px solid var(--amplify-colors-border-primary)" }}
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

