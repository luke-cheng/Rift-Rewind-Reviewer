import type { Metadata } from "next";
import "./app.css";
import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";
import { RegionProvider } from "@/context/RegionContext";
import ToastContainer from "@/components/ToastContainer";

import { Inter } from "next/font/google";
// import { ConfigureAmplify } from "./ConfigureAmplify";
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* <ConfigureAmplify /> */}
        <RegionProvider>
          <ToastProvider>
            {children}
            <ToastContainer />
          </ToastProvider>
        </RegionProvider>
      </body>
    </html>
  );
}
