"use client";

import { ReactNode } from "react";
import { Flex, Text } from "@aws-amplify/ui-react";
import AIInsightIndicator from "./AIInsightIndicator";
import { AIInsights } from "./types";

interface AIStatsCommentProps {
  children: ReactNode;
  insights?: AIInsights;
  title?: string;
}

export default function AIStatsComment({ children, insights, title }: AIStatsCommentProps) {
  return (
    <Flex direction="column" gap="small">
      {title && (
        <Flex direction="row" justifyContent="space-between" alignItems="center">
          <Text fontSize="md" fontWeight="semibold">
            {title}
          </Text>
          {insights && <AIInsightIndicator insights={insights} />}
        </Flex>
      )}
      {children}
    </Flex>
  );
}

