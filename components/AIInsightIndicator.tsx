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

  return (
    <View
      position="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Badge
        variation={badgeVariation}
        fontSize="x-small"
        style={{
          cursor: "pointer",
          transition: "opacity 0.2s",
        }}
      >
        ✨
      </Badge>

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
          opacity: isHovered ? 1 : 0,
          pointerEvents: isHovered ? "auto" : "none",
          transform: isHovered ? "translateX(0)" : "translateX(-5px)",
          transition: "opacity 0.2s ease-in, transform 0.2s ease-in",
          visibility: isHovered ? "visible" : "hidden",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Flex direction="column" gap="xs">
          {insights.summary && (
            <Flex direction="row" gap="xs" style={{ flexWrap: "wrap" }}>
              <AIMatchTag tag={insights.summary} variation={insights.severity === "warning" ? "warning" : "info"} />
            </Flex>
          )}
          {insights.analysis && (
            <Text fontSize="small" color="font.primary">
              {insights.analysis}
            </Text>
          )}
        </Flex>
      </View>
    </View>
  );
}

