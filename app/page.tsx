"use client";

import { View, Flex, Text } from "@aws-amplify/ui-react";
import PageLayout from "@/components/PageLayout";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

export default function HomePage() {
  return (
    <PageLayout>
      <View padding="large" textAlign="center">
        <Flex direction="column" gap="medium" alignItems="center">
          <Text fontSize="2xl" fontWeight="bold">
            Rift Rewind Reviewer
          </Text>
          <Text fontSize="lg" color="font.secondary">
            Track, Reflect, Develop
          </Text>
          <Text color="font.secondary" marginTop="medium">
            Enter a player GameName#tagLine to view their stats and match
            history and gain AI insights.
          </Text>
        </Flex>
      </View>
    </PageLayout>
  );
}
