"use client";

import { useState, useEffect } from "react";
import { ReactNode } from "react";
import { Card, Flex, Text, View, Button, Loader } from "@aws-amplify/ui-react";
import AIStatsComment from "./AIStatsComment";
import { AIInsights, PlayerStats } from "./types";
import { useAIGeneration } from "@/app/client";

interface StatSectionProps {
  title: string;
  children: ReactNode;
  aiInsights?: AIInsights;
  playerStats?: PlayerStats; // Optional: if provided, can generate insights
  padding?: string;
  statType?: "winRate" | "kda" | "cs" | "vision" | "overall"; // Type of stat for context
}

export default function StatSection({
  title,
  children,
  aiInsights: initialInsights,
  playerStats,
  padding = "medium",
  statType = "overall",
}: StatSectionProps) {
  const [insights, setInsights] = useState<AIInsights | undefined>(initialInsights);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [{ data: generatedInsights, isLoading }, generatePlayerInsights] = useAIGeneration("generatePlayerInsights");

  const handleGenerateInsights = async () => {
    if (!playerStats || isGenerating || isLoading) return;

    setIsGenerating(true);
    try {
      // Prepare relevant stats based on statType
      const statsToAnalyze = {
        title,
        statType,
        ...(statType === "winRate" && {
          winRate: playerStats.winRate,
          wins: playerStats.wins,
          losses: playerStats.losses,
          totalMatches: playerStats.totalMatches,
        }),
        ...(statType === "kda" && {
          avgKDA: playerStats.avgKDA,
        }),
        ...(statType === "cs" && {
          avgCS: playerStats.avgCS,
        }),
        ...(statType === "vision" && {
          avgVisionScore: playerStats.avgVisionScore,
        }),
        ...(statType === "overall" && {
          winRate: playerStats.winRate,
          avgKDA: playerStats.avgKDA,
          avgCS: playerStats.avgCS,
          avgVisionScore: playerStats.avgVisionScore,
          avgDamage: playerStats.avgDamage,
          championStats: playerStats.championStats,
          roleStats: playerStats.roleStats,
        }),
      };

      await generatePlayerInsights({
        playerStats: statsToAnalyze,
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

  const isGeneratingInsights = isGenerating || isLoading;
  const canGenerate = playerStats && !insights;

  return (
    <Card variation="outlined" padding={padding}>
      <AIStatsComment 
        insights={insights} 
        title={title}
        onGenerateInsights={canGenerate ? handleGenerateInsights : undefined}
        isGenerating={isGeneratingInsights}
      >
        <View>{children}</View>
      </AIStatsComment>
    </Card>
  );
}

