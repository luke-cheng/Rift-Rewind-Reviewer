"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { View, Flex, Text } from "@aws-amplify/ui-react";
import { client } from "@/app/client";
import PlayerSearch from "./PlayerSearch";
import { useToast } from "@/context/ToastContext";

interface NavBarProps {
  onPlayerSelect?: (puuid: string) => void;
}

export default function NavBar({ onPlayerSelect }: NavBarProps) {
  const router = useRouter();
  const [isSearching, setIsSearching] = React.useState(false);
  const { error: showError } = useToast();

  const handleSearch = async (gameName: string, tagLine: string) => {
    setIsSearching(true);
    try {
      // Call the searchPlayer query through Amplify Gen 2
      const response = await client.queries.searchPlayer({
        gameName,
        tagLine,
      });

      // Log the full API response
      console.error('API response from searchPlayer:', JSON.stringify(response, null, 2));

      const { data, errors } = response;

      // Check for GraphQL errors
      if (errors) {
        showError("Player not found. Please check the game name and tag line.");
        return;
      }

      // Check if data indicates an error response (wrapped error from handler)
      if (data && typeof data === 'object' && 'success' in data && (data as any).success === false) {
        const errorResponse = data as { success: false; error: any };
        
        // Show user-friendly error message
        if (errorResponse.error?.code === 'PLAYER_NOT_FOUND') {
          showError("Player not found. Please check the game name and tag line.");
        } else {
          showError(errorResponse.error?.message || "Error searching for player. Please try again.");
        }
        return;
      }

      if (!data) {
        showError("Player not found. Please check the game name and tag line.");
        return;
      }

      // The searchPlayer query should return an object with puuid
      // Based on the schema, it returns a.json(), so we need to parse it
      let puuid: string | null = null;
      if (typeof data === 'object' && data !== null && 'puuid' in data) {
        puuid = (data as { puuid: string }).puuid;
      } else if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          puuid = parsed.puuid || null;
        } catch {
          // Invalid JSON, will handle below
        }
      }

      if (puuid) {
        if (onPlayerSelect) {
          onPlayerSelect(puuid);
        }
        router.push(`/player/${puuid}`);
      } else {
        showError("Player not found. Please check the game name and tag line.");
      }
    } catch (error) {
      // Log the full error
      console.error('Unexpected error in handleSearch:', JSON.stringify(error, null, 2));
      showError("Error searching for player. Please try again.");
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

