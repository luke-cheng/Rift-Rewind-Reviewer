"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { View, Flex, Text, SelectField } from "@aws-amplify/ui-react";
import { client } from "@/client";
import { useRegion } from "@/context/RegionContext";
import PlayerSearch from "./PlayerSearch";

export default function NavBar() {
  const router = useRouter();
  const [isSearching, setIsSearching] = React.useState(false);
  const { region, setRegion } = useRegion();

  const handleSearch = async (gameName: string, tagLine: string) => {
    setIsSearching(true);

    try {
      const response = await client.queries.searchPlayer({
        gameName,
        tagLine,
        region,
      });

      const { data, errors } = response;

      if (errors) {
        return;
      }

      if (!data) {
        return;
      }

      let puuid: string | null = null;

      if (typeof data === "object" && data !== null) {
        if ("puuid" in data) {
          puuid = (data as { puuid: string }).puuid;
        }
      } else if (typeof data === "string") {
        try {
          const parsed = JSON.parse(data);
          puuid = parsed.puuid || null;
        } catch (parseError) {
          // Failed to parse JSON
          console.error("[DEBUG NavBar] Failed to parse JSON:", parseError);
        }
      }

      if (puuid) {
        router.push(`/player/${puuid}`);
      }
    } catch (error) {
      // Error handling
      console.error("[DEBUG NavBar] Error searching player:", error);
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
        <Flex
          direction="row"
          alignItems="center"
          gap="small"
          flex="1"
          minWidth="300px"
          maxWidth="600px"
          wrap="wrap"
        >
          <View minWidth="120px" maxWidth="150px">
            <SelectField
              label="Region"
              labelHidden
              value={region}
              onChange={(e) => setRegion(e.target.value as "americas" | "asia" | "europe" | "sea")}
              isDisabled={isSearching}
            >
              <option value="americas">Americas</option>
              <option value="asia">Asia</option>
              <option value="europe">Europe</option>
              <option value="sea">SEA</option>
            </SelectField>
          </View>
          <View flex="1" minWidth="200px">
            <PlayerSearch onSearch={handleSearch} isLoading={isSearching} />
          </View>
        </Flex>
      </Flex>
    </View>
  );
}
