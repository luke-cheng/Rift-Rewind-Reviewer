"use client";

import { useState } from "react";
import { Badge, Flex, Text, View } from "@aws-amplify/ui-react";
import { AIInsights } from "./types";
import AIMatchTag from "./AIMatchTag";

interface AIInsightIndicatorProps {
  insights: AIInsights;
}

export default function AIInsightIndicator({ insights }: AIInsightIndicatorProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!insights) {
    return null;
  }

  const badgeVariation = insights.severity === "warning" 
    ? "warning" 
    : insights.severity === "info" 
    ? "info" 
    : undefined;

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  return (
    <View
      position="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Badge
        variation={badgeVariation}
        fontSize="x-small"
        style={{ cursor: "pointer", transition: "opacity 0.2s" }}
      >
        {insights.summary || "✨"}
      </Badge>

      {isHovered && (
        <View
          position="absolute"
          top="0"
          left="100%"
          marginLeft="small"
          backgroundColor="background.primary"
          padding="small"
          borderRadius="small"
          boxShadow="large"
          style={{
            zIndex: 1000,
            minWidth: "200px",
            maxWidth: "300px",
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Flex direction="column" gap="xs">
            {insights.summary && (
              <AIMatchTag summary={insights.summary} severity={insights.severity} />
            )}
            {insights.analysis && (
              <Text fontSize="small" color="font.primary">
                {insights.analysis}
              </Text>
            )}
          </Flex>
        </View>
      )}
    </View>
  );
}

