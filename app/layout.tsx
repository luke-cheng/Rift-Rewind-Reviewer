import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./app.css";
import "./globals.css";
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from "aws-amplify";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rift Rewind Reviewer",
  description: "AI-powered coaching service for League of Legends gameplay performance analyzer",
};

// Configure Amplify - handle case where outputs file might not exist
try {
  const outputs = require("@/amplify_outputs.json");
  Amplify.configure(outputs);
} catch (error) {
  console.warn("Amplify outputs file not found. Amplify will need to be configured.");
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
