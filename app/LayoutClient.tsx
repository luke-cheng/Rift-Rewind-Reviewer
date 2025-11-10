"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { View, Flex, Text } from "@aws-amplify/ui-react";
import NavBar from "@/components/NavBar";

interface LayoutClientProps {
  children: React.ReactNode;
}

export default function LayoutClient({ children }: LayoutClientProps) {
  const router = useRouter();
  const [selectedPuuid, setSelectedPuuid] = useState<string | null>(null);

  const handlePlayerSelect = (puuid: string) => {
    setSelectedPuuid(puuid);
    // Store in localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedPuuid", puuid);
    }
    // Navigate to player page
    router.push(`/player/${puuid}`);
  };

  return (
    <View width="100%" minHeight="100vh" backgroundColor="background.primary">
      <Flex direction="column" minHeight="100vh">
        {/* NavBar - full width */}
        <NavBar onPlayerSelect={handlePlayerSelect} />

        {/* Main content - centered with max width */}
        <View
          flex="1"
          width="100%"
          maxWidth="100%"
          paddingLeft={{ base: "medium", large: "large" }}
          paddingRight={{ base: "medium", large: "large" }}
          paddingTop="large"
          paddingBottom="large"
        >
          {children}
        </View>

        {/* Footer */}
        <View
          as="footer"
          backgroundColor="background.secondary"
          padding="medium"
          borderTop="1px solid"
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
      </Flex>
    </View>
  );
}

