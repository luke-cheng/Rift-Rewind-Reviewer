import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./app.css";
import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";
import ToastContainer from "@/components/ToastContainer";
import { ConfigureAmplify } from "./ConfigureAmplify";
import "@aws-amplify/ui-react/styles.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rift Rewind Reviewer",
  description:
    "AI-powered coaching service for League of Legends gameplay performance analyzer",
  icons: {
    icon: "/amplify.svg",
  },
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
