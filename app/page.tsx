"use client";

import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { View, Flex, Text } from "@aws-amplify/ui-react";

export default function HomePage() {
  return (
    <View width="100%" minHeight="100vh" backgroundColor="background.primary">
      <Flex direction="column" minHeight="100vh">
        {/* NavBar */}
        <NavBar />

        {/* Main content */}
        <View
          flex="1"
          width="100%"
          maxWidth="1200px"
          margin="0 auto"
          paddingLeft={{ base: "medium", large: "large" }}
          paddingRight={{ base: "medium", large: "large" }}
          paddingTop="large"
          paddingBottom="large"
        >
          <View padding="large" textAlign="center">
            <Flex direction="column" gap="medium" alignItems="center">
              <Text fontSize="2xl" fontWeight="bold">
                Rift Rewind Reviewer
              </Text>
              <Text fontSize="lg" color="font.secondary">
                Track, Reflect, Develop
              </Text>
              <Text color="font.secondary" marginTop="medium">
                Search for a player to view their stats and match history
              </Text>
              <Text color="font.secondary" fontSize="small">
                Enter a player name in the format: gameName#tagLine
              </Text>
            </Flex>
          </View>
        </View>

        {/* Footer */}
        <Footer />
      </Flex>
    </View>
  );
}
