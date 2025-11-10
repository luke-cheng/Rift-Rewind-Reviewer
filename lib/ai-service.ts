import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import type { MatchParticipant, AIInsights } from '@/components/types';

const client = generateClient<Schema>();

export async function analyzeMatchHistory(puuid: string): Promise<AIInsights | null> {
  try {
    // Fetch match history from database
    const { data: matches } = await client.models.MatchParticipantIndex.list({
      filter: { puuid: { eq: puuid } },
      limit: 20,
    });

    if (!matches || matches.length === 0) return null;

    // Sort matches by creation time (newest first)
    const sortedMatches = matches.sort((a, b) => (b.gameCreation || 0) - (a.gameCreation || 0));
    
    // Prepare match data for AI analysis
    const matchData = sortedMatches.slice(0, 20).map(m => ({
      win: m.win,
      championName: m.championName,
      teamPosition: m.teamPosition,
      queueId: m.queueId,
      kda: m.kda,
      gameCreation: m.gameCreation,
      kills: m.kills,
      deaths: m.deaths,
      assists: m.assists,
    }));

    // Call AI generation route to analyze match history
    // Generation routes are accessible as queries on the client
    const { data: insights, errors } = await client.queries.analyzeMatchHistory({
      puuid,
      matchData,
    });

    if (errors || !insights) {
      console.error('Error from AI generation:', errors);
      return null;
    }

    // Parse the AI response (should be JSON string)
    let parsedInsights: AIInsights;
    if (typeof insights === 'string') {
      try {
        parsedInsights = JSON.parse(insights);
      } catch (parseError) {
        console.error('Error parsing AI insights:', parseError);
        return null;
      }
    } else if (typeof insights === 'object') {
      parsedInsights = insights as AIInsights;
    } else {
      console.error('Unexpected AI insights format:', typeof insights);
      return null;
    }

    // Validate insights structure
    if (!parsedInsights.severity || !['no-issue', 'info', 'warning'].includes(parsedInsights.severity)) {
      console.error('Invalid insights structure:', parsedInsights);
      return null;
    }
    
    // Store insights in database
    await client.models.PlayerStat.update({
      puuid,
      aiInsights: parsedInsights,
      lastUpdated: Date.now(),
    });

    return parsedInsights;
  } catch (error) {
    console.error('Error analyzing match history:', error);
    return null;
  }
}

export async function analyzeSingleMatch(matchId: string, puuid: string): Promise<AIInsights | null> {
  try {
    // Fetch match participant data
    const { data: participant } = await client.models.MatchParticipantIndex.list({
      filter: {
        puuid: { eq: puuid },
        matchId: { eq: matchId },
      },
      limit: 1,
    });

    if (!participant || participant.length === 0) return null;

    const matchParticipant = participant[0];

    // Prepare match data for AI analysis
    const matchData = {
      win: matchParticipant.win,
      kda: matchParticipant.kda,
      championName: matchParticipant.championName,
      teamPosition: matchParticipant.teamPosition,
      queueId: matchParticipant.queueId,
      gameMode: matchParticipant.gameMode,
      kills: matchParticipant.kills,
      deaths: matchParticipant.deaths,
      assists: matchParticipant.assists,
      gameCreation: matchParticipant.gameCreation,
    };

    // Call AI generation route to analyze single match
    // Generation routes are accessible as queries on the client
    const { data: insights, errors } = await client.queries.analyzeSingleMatch({
      matchId,
      puuid,
      matchData,
    });

    if (errors || !insights) {
      console.error('Error from AI generation:', errors);
      return null;
    }

    // Parse the AI response (should be JSON string)
    let parsedInsights: AIInsights;
    if (typeof insights === 'string') {
      try {
        parsedInsights = JSON.parse(insights);
      } catch (parseError) {
        console.error('Error parsing AI insights:', parseError);
        return null;
      }
    } else if (typeof insights === 'object') {
      parsedInsights = insights as AIInsights;
    } else {
      console.error('Unexpected AI insights format:', typeof insights);
      return null;
    }

    // Validate insights structure
    if (!parsedInsights.severity || !['no-issue', 'info', 'warning'].includes(parsedInsights.severity)) {
      console.error('Invalid insights structure:', parsedInsights);
      return null;
    }
    
    // Store insights in database
    // Update the MatchParticipantIndex record with AI insights
    // Since we already have the participant data, we can update using the id
    if (matchParticipant.id) {
      try {
        await client.models.MatchParticipantIndex.update({
          id: matchParticipant.id,
          aiInsights: parsedInsights,
        });
      } catch (updateError) {
        console.error('Error updating match participant with AI insights:', updateError);
        // Continue even if update fails - we still return the insights
      }
    }
    
    return parsedInsights;
  } catch (error) {
    console.error('Error analyzing single match:', error);
    return null;
  }
}