"use client";

import { ReactNode } from "react";
import { View, Flex } from "@aws-amplify/ui-react";
import NavBar from "./NavBar";
import Footer from "./Footer";

interface PageLayoutProps {
  children: ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <View width="100%" minHeight="100vh" backgroundColor="background.primary">
      <Flex direction="column" minHeight="100vh">
        <NavBar />
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
          {children}
        </View>
        <Footer />
      </Flex>
    </View>
  );
}
