"use client";

import { ReactNode } from "react";
import { Card, Flex, Text, View } from "@aws-amplify/ui-react";
import AIStatsComment from "./AIStatsComment";
import { AIInsights } from "./types";

interface StatSectionProps {
  title: string;
  children: ReactNode;
  aiInsights?: AIInsights;
  padding?: string;
}

export default function StatSection({
  title,
  children,
  aiInsights,
  padding = "medium",
}: StatSectionProps) {
  return (
    <Card variation="outlined" padding={padding}>
      <AIStatsComment insights={aiInsights} title={title}>
        <View>{children}</View>
      </AIStatsComment>
    </Card>
  );
}

