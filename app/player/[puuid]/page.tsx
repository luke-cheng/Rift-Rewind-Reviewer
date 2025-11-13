"use client";

import { useParams } from "next/navigation";
import StatsSection from "@/components/StatSection";
import MatchHistory from "@/components/MatchHistory";
import PageLayout from "@/components/PageLayout";
import { Flex } from "@aws-amplify/ui-react";

import outputs from "../../../amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from "aws-amplify";

Amplify.configure(outputs);

export default function PlayerPage() {
  const params = useParams();
  const puuid = params?.puuid as string;

  return (
    <PageLayout>
      <Flex direction="column" gap="large">
        <StatsSection puuid={puuid} />
        <MatchHistory puuid={puuid} />
      </Flex>
    </PageLayout>
  );
}
