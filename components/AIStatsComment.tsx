"use client";

import { ReactNode } from "react";
import { Flex, Text, Button, Loader } from "@aws-amplify/ui-react";
import AIInsightIndicator from "./AIInsightIndicator";
import { AIInsights } from "./types";

interface AIStatsCommentProps {
  children: ReactNode;
  insights?: AIInsights;
  title?: string;
  onGenerateInsights?: () => void;
  isGenerating?: boolean;
}

export default function AIStatsComment({ 
  children, 
  insights, 
  title,
  onGenerateInsights,
  isGenerating = false,
}: AIStatsCommentProps) {
  return (
    <Flex direction="column" gap="small">
      {title && (
        <Flex direction="row" justifyContent="space-between" alignItems="center">
          <Text fontSize="md" fontWeight="semibold">{title}</Text>
          {insights && <AIInsightIndicator insights={insights} />}
          {!insights && onGenerateInsights && (
            <Button
              size="small"
              variation="link"
              onClick={onGenerateInsights}
              disabled={isGenerating}
              style={{ fontSize: "x-small" }}
            >
              {isGenerating ? (
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
      )}
      {children}
    </Flex>
  );
}

