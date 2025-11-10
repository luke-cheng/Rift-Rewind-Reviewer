"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Flex, Text, Badge, Button, Loader } from "@aws-amplify/ui-react";
import { MatchParticipant, AIInsights } from "./types";
import AIInsightIndicator from "./AIInsightIndicator";
import { useAIGeneration } from "@/lib/client";

interface MatchCardProps {
  match: MatchParticipant;
}

export default function MatchCard({ match }: MatchCardProps) {
  const router = useRouter();
  const [insights, setInsights] = useState<AIInsights | undefined>(match.aiInsights);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [{ data: generatedInsights, isLoading }, generateMatchInsights] = useAIGeneration("generateMatchInsights");

  const handleClick = () => {
    router.push(`/match/${match.matchId}`);
  };

  const handleGenerateInsights = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (isGenerating || isLoading) return;

    setIsGenerating(true);
    try {
      await generateMatchInsights({
        matchData: {
          matchId: match.matchId,
          championName: match.championName,
          win: match.win,
          kills: match.kills,
          deaths: match.deaths,
          assists: match.assists,
          kda: match.kda,
          teamPosition: match.teamPosition,
          totalDamageDealt: match.totalDamageDealt,
          totalDamageDealtToChampions: match.totalDamageDealtToChampions,
          totalMinionsKilled: match.totalMinionsKilled,
          visionScore: match.visionScore,
          goldEarned: match.goldEarned,
          timePlayed: match.timePlayed,
          totalTimeSpentDead: match.totalTimeSpentDead,
          gameDuration: match.gameDuration,
        },
      });
    } catch (error) {
      console.error("Error generating insights:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (generatedInsights) {
      const formattedInsights: AIInsights = {
        severity: (generatedInsights.severity as "no-issue" | "info" | "warning") || "no-issue",
        summary: generatedInsights.summary || undefined,
        analysis: generatedInsights.analysis || undefined,
      };
      setInsights(formattedInsights);
    }
  }, [generatedInsights]);

  const gameDate = new Date(match.gameCreation);
  const kdaDisplay = match.kda !== undefined ? match.kda.toFixed(2) : "N/A";
  const isGeneratingInsights = isGenerating || isLoading;

  return (
    <Card
      variation="outlined"
      padding="medium"
      onClick={handleClick}
      style={{ cursor: "pointer" }}
    >
      <Flex direction="row" justifyContent="space-between" alignItems="center">
        <Flex direction="column" gap="small" flex="1">
          <Flex direction="row" gap="small" alignItems="center">
            <Text fontWeight="bold">{match.championName || "Unknown"}</Text>
            {match.teamPosition && (
              <Text color="font.secondary" fontSize="small">
                {match.teamPosition}
              </Text>
            )}
          </Flex>
          <Text color="font.secondary" fontSize="small">
            {gameDate.toLocaleDateString()} {gameDate.toLocaleTimeString()}
          </Text>
          {match.queueId && (
            <Text color="font.secondary" fontSize="small">
              Queue: {match.queueId}
            </Text>
          )}
        </Flex>
        <Flex direction="column" gap="small" alignItems="flex-end">
          <Badge variation={match.win ? "success" : "error"}>
            {match.win ? "Victory" : "Defeat"}
          </Badge>
          <Text>
            {match.kills || 0}/{match.deaths || 0}/{match.assists || 0}
          </Text>
          <Text color="font.secondary" fontSize="small">
            KDA: {kdaDisplay}
          </Text>
          {insights ? (
            <AIInsightIndicator insights={insights} />
          ) : (
            <Button
              size="small"
              variation="link"
              onClick={handleGenerateInsights}
              disabled={isGeneratingInsights}
              style={{ fontSize: "x-small", padding: "xs" }}
            >
              {isGeneratingInsights ? (
                <Flex direction="row" gap="xs" alignItems="center">
                  <Loader size="small" />
                  <Text fontSize="x-small">Generating...</Text>
                </Flex>
              ) : (
                "✨ Generate Insights"
              )}
            </Button>
          )}
        </Flex>
      </Flex>
    </Card>
  );
}

