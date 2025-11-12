"use client";

import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import { useEffect } from "react";

/**
 * Configure Amplify client-side for Next.js App Router
 * Amplify.configure is idempotent, so it's safe to call multiple times
 */
export const ConfigureAmplify = () => {
  useEffect(() => {
    // Configure Amplify with SSR support for Next.js App Router
    Amplify.configure(outputs);
  }, []);

  return null;
};
