# Frontend UI Design

## Overview

This fil is just for UI only. Integrate AI analytics into the StatsDashboard and match history with hover-based AI tooltips, color-coded match cards based on performance patterns, and real-time AI annotation updates via AWS amplify.

## UI Components

### NavBar

- A simple player `gameName#tagLine` search

### AI Insight Indicator (Hover Tooltip)

- Use AWS Amplify UI `Badge` or custom component with `Icon`
- Small icon badge in top-right corner of match cards
- Visual: A `Badge` with the 1-3 words summary (only visible when `aiInsights` exists)
- Use AWS Amplify UI theme tokens for colors based on severity
- **Hover Behavior**:
  - Custom tooltip or `Popover` component that expands to the right into white space
  - Shows AI comment using `Text` component and tags using `Badge` components
  - Persists when hovering over icon OR tooltip box
  - Smooth expand/collapse animation using CSS transitions
- Color coding based on severity

### Match Card with Color Accent

- Use AWS Amplify UI `Card` component with custom styling
- Right border accent color based on AI severity:
  - `no-issue`: No accent (default)
  - `info`: Use theme token `colors.blue.60` (e.g., new champion, long game)
  - `warning`: Use theme token `colors.orange.60` (e.g., exhaustion, early forfeit)
- Use AWS Amplify UI `Badge` components for tags and win/loss status
- **Performance-based tagging** (not win/loss):
  - Exhaustion: Multiple games in short session
  - New Champion: Player trying new champion
  - Long Game: Extremely long game duration
  - Early Forfeit: Early surrender/remake
- AI indicator icon in top-right when insights exist
- Use `Flex` for layout, `Text` for content display

### Stats Dashboard

- Use AWS Amplify UI `Card` components for each stat section
- Use `View` and `Flex` for layout structure
- Use `Text` for headers and stat values
- Use `Badge` for AI indicator icons
- Each stat section can have optional AI comment indicator
- Small icon in section header when AI has comments
- Use AWS Amplify UI `Popover` for hover tooltip showing AI analysis
- Conditional rendering: Only show indicator if AI insights exist
- Use AWS Amplify UI theme tokens for spacing and colors

### Match History Layout

- Use AWS Amplify UI `View` with `maxWidth` and centered layout
- Centered container with max-width (e.g., 1200px) using theme tokens
- Responsive: Full width on mobile, centered on desktop (built-in responsive utilities)
- Match cards in vertical list using `Flex` with `direction="column"`
- AI indicators on top-right of each card

## Page

 player/[puuid]/page.tsx
NavBar + stats dashboard + match histories + Footer

match/[matchId]/page.tsx
Nav Bar + MatchDetailPage + Footer

## File Structure

```
client.ts                     # Amplify Gen 2 way to Inject AI
components/                   # Use @aws-amplify/ui-react
  NavBar.tsx                  # Navigation bar with integrated player search
  PlayerSearch.tsx            # Player search form component
  AIInsightIndicator.tsx      # Hover tooltip with AI icon badge
  AIMatchTag.tsx              # Tag badges for matches
  AIStatsComment.tsx          # Stats section comment wrapper
  MatchHistory.tsx            # MatchCard list with AI tagging
  MatchCard.tsx               # Individual match card with color accent
  StatsDashboard.tsx          # Main stats dashboard
  Toast.tsx                   # Display Error

app/
  layout.tsx                  # Root layout with Amplify Gen 2 config
  page.tsx                    # Home/landing page
  match/[matchId]/page.tsx    # Detailed match history for current player
  player/[puuid]/page.tsx     # StatsDashboard + MatchHistory
```
