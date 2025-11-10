"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { MatchData } from "@/components/types";
import { View, Text, Card, Flex, Badge } from "@aws-amplify/ui-react";
import AIInsightIndicator from "@/components/AIInsightIndicator";

const client = generateClient<Schema>();

async function fetchMatchDetails(matchId: string): Promise<MatchData | null> {
  // TODO: Fetch MatchCache by matchId
  // This should query the MatchCache model by matchId
  // Return MatchData object or null if not found
  console.log("Fetching match details for:", matchId);
  return null;
}

export default function MatchDetailPage() {
  const params = useParams();
  const matchId = params?.matchId as string;
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;

    setIsLoading(true);
    setError(null);

    fetchMatchDetails(matchId)
      .then((data) => {
        setMatchData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching match details:", err);
        setError("Failed to load match details");
        setIsLoading(false);
      });
  }, [matchId]);

  if (isLoading) {
    return (
      <View padding="large" textAlign="center">
        <Text>Loading match details...</Text>
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

  if (!matchData) {
    return (
      <View padding="large" textAlign="center">
        <Text>Match not found</Text>
      </View>
    );
  }

  const matchInfo = matchData.matchData?.info;
  const participants = matchInfo?.participants || [];

  return (
    <View maxWidth="1200px" margin="0 auto" width="100%">
      <Flex direction="column" gap="large">
        <Card variation="outlined" padding="medium">
          <Flex direction="row" justifyContent="space-between" alignItems="center">
            <View>
              <Text fontSize="2xl" fontWeight="bold">
                Match Details
              </Text>
              <Text color="font.secondary">Match ID: {matchId}</Text>
              {matchInfo && (
                <Text color="font.secondary">
                  {new Date(matchInfo.gameCreation).toLocaleString()}
                </Text>
              )}
            </View>
            {matchData.aiInsights && (
              <AIInsightIndicator insights={matchData.aiInsights} />
            )}
          </Flex>
        </Card>

        {matchInfo && (
          <>
            <Card variation="outlined" padding="medium">
              <Text fontSize="xl" fontWeight="bold" marginBottom="medium">
                Match Information
              </Text>
              <Flex direction="column" gap="small">
                <Text>Game Mode: {matchInfo.gameMode}</Text>
                <Text>Queue ID: {matchInfo.queueId}</Text>
                <Text>
                  Duration: {Math.floor(matchInfo.gameDuration / 60)}:
                  {(matchInfo.gameDuration % 60).toString().padStart(2, "0")}
                </Text>
                <Text>Game Version: {matchInfo.gameVersion}</Text>
              </Flex>
            </Card>

            <Card variation="outlined" padding="medium">
              <Text fontSize="xl" fontWeight="bold" marginBottom="medium">
                Participants
              </Text>
              <Flex direction="column" gap="small">
                {participants.map((participant: any, index: number) => (
                  <Card key={index} variation="elevated" padding="small">
                    <Flex direction="row" justifyContent="space-between" alignItems="center">
                      <View>
                        <Text fontWeight="bold">{participant.championName}</Text>
                        <Text color="font.secondary">
                          {participant.riotIdName}#{participant.riotIdTagline}
                        </Text>
                        <Text color="font.secondary">
                          {participant.teamPosition} • {participant.lane}
                        </Text>
                      </View>
                      <View>
                        <Badge variation={participant.win ? "success" : "error"}>
                          {participant.win ? "Victory" : "Defeat"}
                        </Badge>
                        <Text marginTop="xs">
                          {participant.kills}/{participant.deaths}/{participant.assists}
                        </Text>
                        <Text color="font.secondary" fontSize="small">
                          KDA: {(
                            (participant.kills + participant.assists) /
                            (participant.deaths || 1)
                          ).toFixed(2)}
                        </Text>
                      </View>
                    </Flex>
                  </Card>
                ))}
              </Flex>
            </Card>
          </>
        )}

        {matchData.timelineData && (
          <Card variation="outlined" padding="medium">
            <Text fontSize="xl" fontWeight="bold" marginBottom="medium">
              Timeline
            </Text>
            <Text color="font.secondary">
              Timeline data available (detailed view coming soon)
            </Text>
          </Card>
        )}
      </Flex>
    </View>
  );
}

