import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./app.css";
import "./globals.css";
import "@aws-amplify/ui-react/styles.css";
import { ConfigureAmplify } from "./ConfigureAmplify";
import { ToastProvider } from "@/context/ToastContext";
import ToastContainer from "@/components/ToastContainer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rift Rewind Reviewer",
  description:
    "AI-powered coaching service for League of Legends gameplay performance analyzer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConfigureAmplify />
        <ToastProvider>
        {children}
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}
