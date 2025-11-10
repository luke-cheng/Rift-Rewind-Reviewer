"use client";

import { useState } from "react";
import { TextField, Button, Flex, Text } from "@aws-amplify/ui-react";
import { useToast } from "@/context/ToastContext";

interface PlayerSearchProps {
  onSearch: (gameName: string, tagLine: string) => void;
  isLoading?: boolean;
}

const DEFAULT_TAG = "NA1";

export default function PlayerSearch({ onSearch, isLoading }: PlayerSearchProps) {
  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("");
  const { warning: showWarning } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedGameName = gameName.trim();
    const trimmedTagLine = tagLine.trim() || DEFAULT_TAG;

    if (!trimmedGameName) {
      showWarning("Please enter a player name.");
      return;
    }

    // Validate format: gameName#tagLine
    if (trimmedGameName.includes("#")) {
      showWarning("Player name should not contain #. Use the tag field instead.");
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
          placeholder={DEFAULT_TAG}
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

