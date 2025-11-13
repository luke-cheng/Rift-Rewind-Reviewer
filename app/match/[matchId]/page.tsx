"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { client } from "@/client";
import { MatchData } from "@/components/types";
import { View, Text, Card, Flex, Badge } from "@aws-amplify/ui-react";
import AIInsightIndicator from "@/components/AIInsightIndicator";
import PageLayout from "@/components/PageLayout";
import { useToast } from "@/context/ToastContext";

function parseJsonField(field: any): any {
  if (typeof field === "string") {
    try {
      return JSON.parse(field);
    } catch {
      return null;
    }
  }
  return field;
}

async function fetchMatchDetails(matchId: string, region?: string): Promise<MatchData | null> {
  try {
    // First, check DynamoDB MatchCache
    const { data, errors } = await client.models.MatchCache.get({ matchId });

    if (!errors && data) {
      const matchData = parseJsonField(data.matchData);
      // Check if matchData is valid (not null/empty)
      if (matchData && typeof matchData === 'object' && Object.keys(matchData).length > 0) {
        return {
          matchId: data.matchId,
          gameCreation: data.gameCreation,
          matchData: matchData,
          timelineData: parseJsonField(data.timelineData),
          expiresAt: data.expiresAt ?? undefined,
          processedAt: data.processedAt ?? undefined,
          aiInsights: data.aiInsights as MatchData["aiInsights"],
        };
      }
    }

    // If DynamoDB is empty or missing, fallback to GraphQL query
    // This will check DynamoDB → S3 → Riot API
    console.log(`Match ${matchId} not found in DynamoDB or empty, fetching via GraphQL query`);
    const { data: matchDetails, errors: queryErrors } = await client.queries.getMatchDetails({
      matchId,
      region: region || 'americas',
    });

    if (queryErrors || !matchDetails) {
      return null;
    }

    // Parse the match data if needed
    const parsedMatchData = parseJsonField(matchDetails);
    
    // Return a MatchData structure with the fetched data
    return {
      matchId,
      gameCreation: parsedMatchData?.info?.gameCreation || Date.now(),
      matchData: parsedMatchData,
      timelineData: undefined,
      expiresAt: undefined,
      processedAt: undefined,
      aiInsights: undefined,
    };
  } catch (error) {
    console.error('Error fetching match details:', error);
    return null;
  }
}

export default function MatchDetailPage() {
  const params = useParams();
  const matchId = params?.matchId as string;
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { error: showError } = useToast();

  useEffect(() => {
    if (!matchId) return;

    setIsLoading(true);
    setError(null);

    fetchMatchDetails(matchId)
      .then((data) => {
        if (!data) {
          setError("Failed to load match details");
          showError("Failed to load match details");
        }
        setMatchData(data);
        setIsLoading(false);
      })
      .catch(() => {
        setError("Failed to load match details");
        showError("Failed to load match details");
        setIsLoading(false);
      });
  }, [matchId, showError]);

  if (isLoading) {
    return (
      <PageLayout>
        <View padding="large" textAlign="center">
          <Text>Loading match details...</Text>
        </View>
      </PageLayout>
    );
  }

  if (error || !matchData) {
    return (
      <PageLayout>
        <View padding="large" textAlign="center">
          <Text color="font.error">{error || "Match not found"}</Text>
        </View>
      </PageLayout>
    );
  }

  const matchInfo = matchData.matchData?.info;
  const participants = matchInfo?.participants || [];

  return (
    <PageLayout>
      <Flex direction="column" gap="large">
            <Card variation="outlined" padding="medium">
              <Flex
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
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
                      {(matchInfo.gameDuration % 60)
                        .toString()
                        .padStart(2, "0")}
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
                        <Flex
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <View>
                            <Text fontWeight="bold">
                              {participant.championName}
                            </Text>
                            <Text color="font.secondary">
                              {participant.riotIdName}#
                              {participant.riotIdTagline}
                            </Text>
                            <Text color="font.secondary">
                              {participant.teamPosition} • {participant.lane}
                            </Text>
                          </View>
                          <View>
                            <Badge
                              variation={participant.win ? "success" : "error"}
                            >
                              {participant.win ? "Victory" : "Defeat"}
                            </Badge>
                            <Text marginTop="xs">
                              {participant.kills}/{participant.deaths}/
                              {participant.assists}
                            </Text>
                            <Text color="font.secondary" fontSize="small">
                              KDA:{" "}
                              {(
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
    </PageLayout>
  );
}
