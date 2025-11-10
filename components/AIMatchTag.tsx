"use client";

import { Badge } from "@aws-amplify/ui-react";

interface AIMatchTagProps {
  /** Summary text from AI insights (2-4 words) */
  summary: string;
  /** Severity level from AI insights */
  severity?: "no-issue" | "info" | "warning";
}

/**
 * AIMatchTag displays a badge with the AI-generated match summary.
 * The badge variation is determined by the severity level:
 * - warning: Orange/warning badge
 * - info: Blue/info badge
 * - no-issue or undefined: Default badge style
 */
export default function AIMatchTag({ summary, severity }: AIMatchTagProps) {
  // Map severity to badge variation
  const badgeVariation = severity === "warning" 
    ? "warning" 
    : severity === "info" 
    ? "info" 
    : undefined; // undefined uses default badge style

  return (
    <Badge variation={badgeVariation} fontSize="small">
      {summary}
    </Badge>
  );
}

