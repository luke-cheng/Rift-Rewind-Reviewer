"use client";

import { View, Flex, Text, Grid } from "@aws-amplify/ui-react";
import { PlayerStats } from "./types";
import StatSection from "./StatSection";

interface StatsDashboardProps {
  stats: PlayerStats | null;
  isLoading?: boolean;
}

export default function StatsDashboard({ stats, isLoading }: StatsDashboardProps) {
  if (isLoading) {
    return (
      <View maxWidth="1200px" margin="0 auto" padding="medium">
        <Text>Loading stats...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View maxWidth="1200px" margin="0 auto" padding="medium">
        <Text>No stats available. Search for a player to view their statistics.</Text>
      </View>
    );
  }

  const winRate = stats.winRate
    ? (stats.winRate * 100).toFixed(1)
    : stats.totalMatches
    ? ((stats.wins || 0) / stats.totalMatches) * 100
    : 0;

  return (
    <View maxWidth="1200px" margin="0 auto" padding="medium">
      <Flex direction="column" gap="large">
        {/* Player Info */}
        {stats.riotId && (
          <View>
            <Text fontSize="2xl" fontWeight="bold">
              {stats.riotId.gameName}#{stats.riotId.tagLine}
            </Text>
          </View>
        )}

        {/* Overall Stats Grid */}
        <Grid
          templateColumns={{ base: "1fr", medium: "repeat(2, 1fr)", large: "repeat(4, 1fr)" }}
          gap="medium"
        >
          <StatSection
            title="Win Rate"
            aiInsights={stats.aiInsights?.severity !== "no-issue" ? stats.aiInsights : undefined}
            playerStats={stats}
            statType="winRate"
          >
            <Text fontSize="3xl" fontWeight="bold">
              {winRate}%
            </Text>
            <Text color="font.secondary" fontSize="small">
              {stats.wins || 0}W - {stats.losses || 0}L ({stats.totalMatches || 0} games)
            </Text>
          </StatSection>

          <StatSection 
            title="Average KDA"
            playerStats={stats}
            statType="kda"
          >
            {stats.avgKDA ? (
              <>
                <Text fontSize="3xl" fontWeight="bold">
                  {stats.avgKDA.ratio.toFixed(2)}
                </Text>
                <Text color="font.secondary" fontSize="small">
                  {stats.avgKDA.kills.toFixed(1)} / {stats.avgKDA.deaths.toFixed(1)} /{" "}
                  {stats.avgKDA.assists.toFixed(1)}
                </Text>
              </>
            ) : (
              <Text color="font.secondary">No data available</Text>
            )}
          </StatSection>

          <StatSection 
            title="Average CS"
            playerStats={stats}
            statType="cs"
          >
            {stats.avgCS ? (
              <>
                <Text fontSize="3xl" fontWeight="bold">
                  {stats.avgCS.toFixed(1)}
                </Text>
                <Text color="font.secondary" fontSize="small">
                  CS per minute
                </Text>
              </>
            ) : (
              <Text color="font.secondary">No data available</Text>
            )}
          </StatSection>

          <StatSection 
            title="Average Vision Score"
            playerStats={stats}
            statType="vision"
          >
            {stats.avgVisionScore ? (
              <>
                <Text fontSize="3xl" fontWeight="bold">
                  {stats.avgVisionScore.toFixed(1)}
                </Text>
                <Text color="font.secondary" fontSize="small">
                  Vision score per game
                </Text>
              </>
            ) : (
              <Text color="font.secondary">No data available</Text>
            )}
          </StatSection>
        </Grid>

        {/* Champion Stats */}
        {stats.championStats && Object.keys(stats.championStats).length > 0 && (
          <StatSection title="Top Champions" padding="large">
            <Flex direction="column" gap="small">
              {Object.entries(stats.championStats)
                .slice(0, 5)
                .map(([championId, champStats]) => (
                  <Flex
                    key={championId}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    padding="small"
                    backgroundColor="background.secondary"
                    borderRadius="small"
                  >
                    <Text fontWeight="medium">Champion {championId}</Text>
                    <Flex direction="row" gap="medium" alignItems="center">
                      <Text color="font.secondary" fontSize="small">
                        {champStats.wins}W - {champStats.losses}L
                      </Text>
                      <Text color="font.secondary" fontSize="small">
                        KDA: {champStats.kda?.toFixed(2) || "N/A"}
                      </Text>
                      <Text color="font.secondary" fontSize="small">
                        {champStats.games} games
                      </Text>
                    </Flex>
                  </Flex>
                ))}
            </Flex>
          </StatSection>
        )}

        {/* Role Stats */}
        {stats.roleStats && Object.keys(stats.roleStats).length > 0 && (
          <StatSection title="Role Performance" padding="large">
            <Flex direction="column" gap="small">
              {Object.entries(stats.roleStats).map(([role, roleStats]) => (
                <Flex
                  key={role}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  padding="small"
                  backgroundColor="background.secondary"
                  borderRadius="small"
                >
                  <Text fontWeight="medium">{role}</Text>
                  <Flex direction="row" gap="medium" alignItems="center">
                    <Text color="font.secondary" fontSize="small">
                      {roleStats.wins}W - {roleStats.losses}L
                    </Text>
                    <Text color="font.secondary" fontSize="small">
                      {roleStats.games} games
                    </Text>
                  </Flex>
                </Flex>
              ))}
            </Flex>
          </StatSection>
        )}
      </Flex>
    </View>
  );
}

