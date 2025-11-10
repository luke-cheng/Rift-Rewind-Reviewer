"use client";

import { useState } from "react";
import { TextField, Button, Flex } from "@aws-amplify/ui-react";

interface PlayerSearchProps {
  onSearch: (gameName: string, tagLine: string) => void;
  isLoading?: boolean;
}

export default function PlayerSearch({ onSearch, isLoading }: PlayerSearchProps) {
  const [searchValue, setSearchValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = searchValue.split("#");
    if (parts.length === 2) {
      const [gameName, tagLine] = parts;
      onSearch(gameName.trim(), tagLine.trim());
    } else {
      // Try to handle cases where # might be missing or formatted differently
      alert("Please enter player name in format: gameName#tagLine");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="row" gap="small" alignItems="stretch">
        <TextField
          label="Player Search"
          placeholder="gameName#tagLine"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          isDisabled={isLoading}
          width="100%"
        />
        <Button
          type="submit"
          variation="primary"
          isLoading={isLoading}
        >
          Search
        </Button>
      </Flex>
    </form>
  );
}

