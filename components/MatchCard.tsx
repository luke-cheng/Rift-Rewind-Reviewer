"use client";

import { useRouter } from "next/navigation";
import { Card, Flex, Text, Badge } from "@aws-amplify/ui-react";
import { MatchParticipant } from "./types";
import AIInsightIndicator from "./AIInsightIndicator";

interface MatchCardProps {
  match: MatchParticipant;
}

export default function MatchCard({ match }: MatchCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/match/${match.matchId}`);
  };

  const gameDate = new Date(match.gameCreation);
  const kdaDisplay = match.kda !== undefined ? match.kda.toFixed(2) : "N/A";

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
          {match.aiInsights && (
            <AIInsightIndicator insights={match.aiInsights} />
          )}
        </Flex>
      </Flex>
    </Card>
  );
}

