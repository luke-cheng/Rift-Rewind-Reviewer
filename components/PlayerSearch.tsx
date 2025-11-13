"use client";

import { useState } from "react";
import { TextField, Button, Flex, Text } from "@aws-amplify/ui-react";

interface PlayerSearchProps {
  onSearch: (gameName: string, tagLine: string) => void;
  isLoading?: boolean;
}

export default function PlayerSearch({ onSearch, isLoading }: PlayerSearchProps) {
  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedGameName = gameName.trim();
    const trimmedTagLine = tagLine.trim();

    if (!trimmedGameName || !trimmedTagLine) {
      return;
    }

    // Validate format: gameName#tagLine
    if (trimmedGameName.includes("#")) {
      return;
    }

    onSearch(trimmedGameName, trimmedTagLine);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="row" gap="small" alignItems="flex-end" wrap="wrap">
        <TextField
          label="Game Name"
          placeholder="Enter game name"
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
          isDisabled={isLoading}
          width="100%"
          flex="1"
          minWidth="150px"
        />
        <Flex
          alignItems="center"
          height="40px"
          paddingBottom="0.5rem"
          style={{ flexShrink: 0 }}
        >
          <Text fontSize="lg" fontWeight="bold" color="font.primary">
            #
          </Text>
        </Flex>
        <TextField
          label="Tag Line"
          placeholder="NA1"
          value={tagLine}
          onChange={(e) => setTagLine(e.target.value)}
          isDisabled={isLoading}
          width="100px"
          flex="0 0 auto"
        />
        <Button
          type="submit"
          variation="primary"
          isLoading={isLoading}
          style={{ flexShrink: 0 }}
        >
          Search
        </Button>
      </Flex>
    </form>
  );
}

