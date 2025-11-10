"use client";

import { View, Text } from "@aws-amplify/ui-react";

export default function Footer() {
  return (
    <View
      as="footer"
      backgroundColor="background.secondary"
      padding="medium"
      border="1px solid"
      borderColor="border.primary"
      textAlign="center"
    >
      <Text fontSize="small" color="font.secondary">
        Report issues on{" "}
        <a
          href="https://github.com/luke-cheng/rift-rewind-reviewer"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--amplify-colors-blue-60)", textDecoration: "underline" }}
        >
          GitHub
        </a>
      </Text>
    </View>
  );
}

