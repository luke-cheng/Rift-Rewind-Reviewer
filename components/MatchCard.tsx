"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Flex, Text, Badge, Button, Loader } from "@aws-amplify/ui-react";
import { MatchParticipant, AIInsights } from "./types";
import AIInsightIndicator from "./AIInsightIndicator";
import AIMatchTag from "./AIMatchTag";
import { useAIGeneration } from "@/app/client";
import { useToast } from "@/context/ToastContext";

interface MatchCardProps {
  match: MatchParticipant;
}

export default function MatchCard({ match }: MatchCardProps) {
  const router = useRouter();
  const [insights, setInsights] = useState<AIInsights | undefined>(match.aiInsights);
  const [isGenerating, setIsGenerating] = useState(false);
  const { error: showError } = useToast();
  
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
    } catch {
      showError("Failed to generate insights. Please try again.");
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

  // Determine border accent color based on AI severity
  const getBorderStyle = () => {
    if (!insights || insights.severity === "no-issue") {
      return {};
    }
    const borderColor = insights.severity === "warning" 
      ? "var(--amplify-colors-orange-60)"
      : "var(--amplify-colors-blue-60)";
    return {
      borderRight: `4px solid ${borderColor}`,
    };
  };

  // Determine performance-based tags
  const getPerformanceTags = () => {
    const tags: Array<{ summary: string; severity: "info" | "warning" }> = [];
    
    // Long Game: >45 minutes (2700 seconds)
    if (match.gameDuration && match.gameDuration > 2700) {
      tags.push({ summary: "Long Game", severity: "info" });
    }
    
    // Early Forfeit: <20 minutes (1200 seconds) - typical surrender/remake
    if (match.gameDuration && match.gameDuration < 1200) {
      tags.push({ summary: "Early Forfeit", severity: "warning" });
    }
    
    return tags;
  };

  const performanceTags = getPerformanceTags();

  return (
    <Card
      variation="outlined"
      padding="medium"
      onClick={handleClick}
      style={{ 
        cursor: "pointer",
        ...getBorderStyle(),
      }}
    >
      <Flex direction="row" justifyContent="space-between" alignItems="center">
        <Flex direction="column" gap="small" flex="1">
          <Flex direction="row" gap="small" alignItems="center" wrap="wrap">
            <Text fontWeight="bold">{match.championName || "Unknown"}</Text>
            {match.teamPosition && (
              <Text color="font.secondary" fontSize="small">
                {match.teamPosition}
              </Text>
            )}
            {performanceTags.map((tag, index) => (
              <AIMatchTag key={index} summary={tag.summary} severity={tag.severity} />
            ))}
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

