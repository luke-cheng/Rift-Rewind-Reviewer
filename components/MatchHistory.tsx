"use client";

import { useState, useEffect } from "react";
import { View, Flex, Text, SelectField } from "@aws-amplify/ui-react";
import { MatchParticipant } from "./types";
import MatchCard from "./MatchCard";

interface MatchHistoryProps {
  puuid: string;
  year?: number;
}

async function fetchMatchHistory(puuid: string, year?: number): Promise<MatchParticipant[]> {
  // TODO: Query MatchParticipantIndex by puuid
  // This should query the MatchParticipantIndex model filtered by puuid
  // Optionally filter by year (gameCreation timestamp)
  // Return array of MatchParticipant objects
  console.log("Fetching match history for:", puuid, year);
  return [];
}

export default function MatchHistory({ puuid, year }: MatchHistoryProps) {
  const [matches, setMatches] = useState<MatchParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(year || new Date().getFullYear());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!puuid) return;

    setIsLoading(true);
    setError(null);

    fetchMatchHistory(puuid, selectedYear)
      .then((data) => {
        setMatches(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching match history:", err);
        setError("Failed to load match history");
        setIsLoading(false);
      });
  }, [puuid, selectedYear]);

  // Generate year options (current year and past few years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (!puuid) {
    return (
      <View padding="large" textAlign="center">
        <Text>Please search for a player to view match history</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View padding="large" textAlign="center">
        <Text>Loading match history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View padding="large" textAlign="center">
        <Text color="font.error">{error}</Text>
      </View>
    );
  }

  return (
    <View maxWidth="1200px" margin="0 auto" padding="medium">
      <Flex direction="column" gap="medium">
        <Flex direction="row" justifyContent="space-between" alignItems="center">
          <Text fontSize="xl" fontWeight="bold">
            Match History
          </Text>
          <SelectField
            label="Year"
            labelHidden
            value={selectedYear.toString()}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </SelectField>
        </Flex>

        {matches.length === 0 ? (
          <View padding="large" textAlign="center">
            <Text>No matches found for this year</Text>
          </View>
        ) : (
          <Flex direction="column" gap="small">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </Flex>
        )}
      </Flex>
    </View>
  );
}

