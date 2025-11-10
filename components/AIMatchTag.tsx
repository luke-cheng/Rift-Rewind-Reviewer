"use client";

import { Badge } from "@aws-amplify/ui-react";

interface AIMatchTagProps {
  tag: string;
  variation?: "info" | "warning" | "default";
}

const tagVariations: Record<string, "info" | "warning" | "default"> = {
  "Exhaustion": "warning",
  "New Champion": "info",
  "Long Game": "info",
  "Early Forfeit": "warning",
};

export default function AIMatchTag({ tag, variation }: AIMatchTagProps) {
  const badgeVariation = variation || tagVariations[tag] || "default";

  return (
    <Badge variation={badgeVariation} fontSize="x-small">
      {tag}
    </Badge>
  );
}

