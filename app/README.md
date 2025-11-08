# Frontend AI Analytics Design

## Overview

Integrate AI analytics into the StatsDashboard and match history with hover-based AI tooltips, color-coded match cards based on performance patterns, and real-time AI annotation updates via AppSync subscriptions.

## Data Flow Pattern

### Backend Processing Flow

1. **Frontend Request**: Query match data via GraphQL
2. **Backend Check**: Lambda checks DynamoDB cache first
3. **If Not Cached**:
   - Call Riot API to fetch match data
   - **Parallel Processing**:
     - ✅ Send match data to frontend immediately (via GraphQL query response)
     - ✅ Cache match data to DynamoDB
     - ✅ Trigger AI annotation Lambda (async, non-blocking)
4. **AI Annotation**:
   - Lambda analyzes match data with AWS Bedrock
   - Updates DynamoDB with `aiInsights` field
5. **Real-time Update**:
   - AppSync subscription listens for DynamoDB updates on Match records
   - When AI annotation completes, push update to frontend via subscription
   - React automatically rerenders when subscription data arrives

### React Rerendering Behavior

- **Initial Render**: Match data loads, `aiInsights` is `null`
- **Subscription Update**: When AI annotation completes, DynamoDB update triggers AppSync subscription
- **React Rerender**: Component receives updated match with `aiInsights` populated
- **UI Update**: AI indicator appears, match card gets color accent, tooltip becomes available

## Key Design Decisions

### AI Data Structure

- **Schema Extensions**: Add `aiInsights` fields to Match and PlayerStat models:
  - `Match.aiInsights`: Optional field (null initially, populated after AI analysis) with:
    - `tags`: Array of strings ("exhaustion", "new-champion", "long-game", "early-forfeit")
    - `comment`: String (AI analysis text)
    - `severity`: Enum ("no-issue", "info", "warning")
    - `analyzedAt`: Timestamp
  - `PlayerStat.aiInsights`: Optional field with section-level comments for stats
- **Initial State**: `aiInsights` is `null` until AI analysis completes
- **Update Mechanism**: AppSync subscription on Match/PlayerStat model updates

### Layout Structure

- **Navigation Bar**: Persistent navbar with integrated player search component (accessible from all pages)
- **Dashboard on Top**: StatsDashboard component with all player statistics
- **Match History Below**: Centered container with max-width constraint (e.g., 1200px)
- **Match Cards**: List of match cards in vertical list, each with AI indicator in top-right corner

## AWS Services Integration

### AWS Amplify UI React Components

**Available Components**:
- **Layout Components**: `View`, `Flex`, `Card` for structure
- **Form Components**: `Input`, `Button`, `SelectField` for forms
- **Display Components**: `Text`, `Badge`, `Alert` for content
- **Loading Components**: `Loader` for loading states
- **Theme System**: Use AWS Amplify UI theme tokens for colors, spacing, typography
- **Responsive Design**: Built-in responsive utilities and breakpoints

### GraphQL with AWS AppSync

Using AWS Amplify Gen 2's `generateClient`:

#### Initial Query
```tsx
const { data: matches } = await client.models.Match.list({
  filter: { puuid: { eq: puuid } },
  limit: 20
});
// matches will have aiInsights: null initially
```

#### Subscription Setup (AppSync Real-time)
```tsx
useEffect(() => {
  // Subscribe to updates (including AI insights) via AppSync
  const subscription = client.models.Match.observeQuery({
    filter: { puuid: { eq: puuid } }
  }).subscribe({
    next: ({ items }) => {
      // This will trigger rerender when AI insights are added
      // AppSync automatically pushes updates when DynamoDB changes
      setMatches(items);
    }
  });

  return () => subscription.unsubscribe();
}, [puuid]);
```

### AWS Services Used

- **AWS AppSync**: GraphQL API with real-time subscriptions
- **Amazon DynamoDB**: Match and PlayerStat storage with automatic subscriptions
- **AWS Lambda**: Data fetching, caching, and AI annotation processing
- **AWS Bedrock**: AI analysis and insights generation
- **AWS Amplify**: Hosting, CI/CD, and backend infrastructure

## UI Components Design

### 1. AI Insight Indicator (Hover Tooltip)

- Use AWS Amplify UI `Badge` or custom component with `Icon`
- Small icon badge in top-right corner of match cards
- Visual: Sparkle/AI icon (only visible when `aiInsights` exists)
- Use AWS Amplify UI theme tokens for colors based on severity
- **Hover Behavior**: 
  - Custom tooltip or `Popover` component that expands to the right into white space
  - Shows AI comment using `Text` component and tags using `Badge` components
  - Persists when hovering over icon OR tooltip box
  - Smooth expand/collapse animation using CSS transitions
- Color coding based on severity using theme tokens (e.g., `colors.blue.60`, `colors.orange.60`)

### 2. Match Card with Color Accent

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

### 3. Stats Dashboard

- Use AWS Amplify UI `Card` components for each stat section
- Use `View` and `Flex` for layout structure
- Use `Text` for headers and stat values
- Use `Badge` for AI indicator icons
- Each stat section can have optional AI comment indicator
- Small icon in section header when AI has comments
- Use AWS Amplify UI `Popover` for hover tooltip showing AI analysis
- Conditional rendering: Only show indicator if AI insights exist
- Use AWS Amplify UI theme tokens for spacing and colors

### 4. Match History Layout

- Use AWS Amplify UI `View` with `maxWidth` and centered layout
- Centered container with max-width (e.g., 1200px) using theme tokens
- Responsive: Full width on mobile, centered on desktop (built-in responsive utilities)
- Match cards in vertical list using `Flex` with `direction="column"`
- AI indicators on top-right of each card

## Conditional Rendering Pattern

```tsx
{/* Show AI indicator only when insights exist */}
{match.aiInsights && (
  <AIInsightIndicator 
    insights={match.aiInsights}
    matchId={match.matchId}
  />
)}

{/* Match card with color accent based on severity */}
<MatchCard 
  match={match}
  accentColor={match.aiInsights?.severity || 'no-issue'}
/>

{/* Optional: Show subtle loading state */}
{!match.aiInsights && showLoadingState && (
  <Text fontSize="small" color="font.secondary" className="opacity-50">
    AI analysis in progress...
  </Text>
)}
```

## File Structure

```
components/
  NavBar.tsx                  # Navigation bar with integrated player search (uses View, Flex)
  PlayerSearch.tsx            # Player search form component (used in NavBar, uses Input, Button, SelectField)
  AIInsightIndicator.tsx      # Hover tooltip with AI icon badge (uses Badge, Popover)
  AIMatchTag.tsx              # Tag badges for matches (uses Badge)
  AIStatsComment.tsx          # Stats section comment wrapper (uses View, Text, Popover)
  MatchHistory.tsx            # Match list with AI tagging (uses View, Flex)
  MatchCard.tsx               # Individual match card with color accent (uses Card, Badge, Flex)
  StatsDashboard.tsx          # Main stats dashboard (uses View, Flex, Card)
  StatSection.tsx             # Reusable stat section (uses Card, Text, Badge)

app/
  layout.tsx                  # Root layout with navigation bar
  page.tsx                    # Home/landing page
  player/[puuid]/page.tsx     # Player stats page (StatsDashboard + MatchHistory)
  
types/
  ai-insights.ts              # TypeScript types for AI insights
```

## Implementation Steps

### Step 1: Update GraphQL Schema
- Extend `Match` model in `amplify/data/resource.ts` to include `aiInsights` field (AWSJSON type)
- Extend `PlayerStat` model to include `aiInsights` field with section-specific comments
- Enable subscriptions on Match and PlayerStat models
- Define TypeScript types for AI insights structure in `types/ai-insights.ts`

### Step 2: Create AI UI Components with AWS Amplify UI
- `components/AIInsightIndicator.tsx` - Hover tooltip using AWS Amplify UI `Popover` or custom tooltip with `Badge` icon
- `components/AIMatchTag.tsx` - Tag badge component using AWS Amplify UI `Badge` component
- `components/AIStatsComment.tsx` - Wrapper using AWS Amplify UI `View`, `Text`, and `Popover`
- All components use AWS Amplify UI components and theme tokens
- All components handle `null` aiInsights gracefully

### Step 3: Build Match History Component with AWS Amplify UI
- `components/MatchHistory.tsx` - List of matches using AWS Amplify UI `View` and `Flex`
- `components/MatchCard.tsx` - Individual match card using AWS Amplify UI `Card` with:
  - Right border accent color based on severity (using theme tokens)
  - AI indicator in top-right corner using `Badge` or `Icon`
  - Hover tooltip that expands to the right using `Popover` or custom tooltip
- Centered layout with max-width using AWS Amplify UI `View` props
- Use AWS Amplify UI `Loader` for loading states

### Step 4: Build Stats Dashboard Component with AWS Amplify UI
- `components/StatsDashboard.tsx` - Main dashboard using AWS Amplify UI `View`, `Flex`, `Card`
- `components/StatSection.tsx` - Reusable stat section using AWS Amplify UI `Card` with:
  - `Text` for headers and values
  - `Badge` for AI indicators
  - `Popover` for AI comment tooltips
  - Theme tokens for consistent styling
- Conditional rendering: Only show AI comment sections when insights exist
- Integrate AI indicators in section headers using AWS Amplify UI components
- Use AWS Amplify UI `Loader` for loading states

### Step 5: GraphQL Integration & AppSync Subscriptions
- Update queries to fetch `aiInsights` fields (will be null initially)
- Set up AWS AppSync subscriptions using `client.models.Match.observeQuery()`
- Handle subscription updates: When `aiInsights` is added/updated in DynamoDB, AppSync automatically pushes to frontend
- React will automatically rerender when subscription data arrives
- Handle loading states: Use AWS Amplify UI `Loader` or subtle indicator when `aiInsights` is null (analysis in progress)
- Error handling: Use AWS Amplify UI `Alert` component for errors
- Use AWS Amplify UI `Button` with `isLoading` prop for async actions

### Step 6: Styling & UX with AWS Amplify UI
- Use AWS Amplify UI theme tokens for colors, spacing, typography
- Leverage built-in responsive design utilities
- Use AWS Amplify UI components for consistent styling
- Smooth animations for hover tooltip expansion (CSS transitions)
- Color coding for severity levels using theme tokens
- Accessibility: Built-in ARIA labels in AWS Amplify UI components
- Loading states: Use `Button` `isLoading` prop and `Loader` component
- Theme customization: Use Amplify UI theme provider if needed

## Backend Integration Notes (for reference)

### AWS Lambda Functions
- `fetchRiotData` Lambda: After fetching match, cache to DynamoDB, trigger AI annotation async
- `analyzeMatches` Lambda: After computing stats, trigger AI annotation
- **AI Annotation Lambda**: 
  - Receives match data from DynamoDB
  - Analyzes with AWS Bedrock (AI service)
  - Updates DynamoDB Match record with `aiInsights` field
  - AWS AppSync subscription automatically pushes update to frontend via real-time subscriptions

### AWS Services for Async Processing
- **Option 1**: DynamoDB Streams trigger AI annotation Lambda when new matches are stored
- **Option 2**: Lambda explicitly triggers AI annotation after caching match data
- **Option 3**: Amazon EventBridge scheduled rule for batch AI analysis
- **AWS Bedrock**: AI/ML service for generating insights and annotations
- **Amazon DynamoDB**: Database with automatic AppSync subscription triggers
- **AWS AppSync**: Real-time GraphQL API with automatic subscription updates

## Example Component Usage

### Using AWS Amplify UI Components

```tsx
import { View, Text, Card, Badge, Flex, Button, Loader } from "@aws-amplify/ui-react";

// Example: Match Card with AI Indicator
<Card variation="outlined" style={{ borderRight: `4px solid ${accentColor}` }}>
  <Flex direction="row" justifyContent="space-between" alignItems="center">
    <Flex direction="column">
      <Text fontSize="large" fontWeight="bold">{championName}</Text>
      <Text fontSize="small" color="font.secondary">{gameMode}</Text>
    </Flex>
    <Badge variation={win ? "success" : "error"}>{win ? "Victory" : "Defeat"}</Badge>
  </Flex>
  {aiInsights && <AIInsightIndicator insights={aiInsights} />}
</Card>

// Example: Loading State
{loading && <Loader size="large" />}

// Example: Button with Loading
<Button variation="primary" isLoading={isSubmitting}>
  Search Player
</Button>
```

### Using Theme Tokens

```tsx
import { useTheme } from "@aws-amplify/ui-react";

const { tokens } = useTheme();

// Access theme tokens
const accentColor = tokens.colors.blue[60]; // For info severity
const warningColor = tokens.colors.orange[60]; // For warning severity
```

## Next Steps

1. Update GraphQL schema with aiInsights fields and enable subscriptions
2. Create TypeScript types for AI insights
3. Build reusable AI UI components using AWS Amplify UI
4. Implement MatchHistory and StatsDashboard components
5. Set up GraphQL subscriptions for real-time updates
6. Add styling, animations, and responsive design
7. Test subscription flow: initial null → AI analysis → subscription update → rerender

