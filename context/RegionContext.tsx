"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type RiotRegion = "americas" | "asia" | "europe" | "sea";

interface RegionContextType {
  region: RiotRegion;
  setRegion: (region: RiotRegion) => void;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

const REGION_STORAGE_KEY = "rift-rewind-region";
const DEFAULT_REGION: RiotRegion = "americas";

export function RegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState<RiotRegion>(DEFAULT_REGION);

  // Load region from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedRegion = localStorage.getItem(REGION_STORAGE_KEY);
        if (
          storedRegion &&
          ["americas", "asia", "europe", "sea"].includes(storedRegion)
        ) {
          setRegionState(storedRegion as RiotRegion);
        }
      } catch (error) {
        console.error("Failed to load region from localStorage:", error);
      }
    }
  }, []);

  // Save region to localStorage when it changes
  const setRegion = (newRegion: RiotRegion) => {
    setRegionState(newRegion);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(REGION_STORAGE_KEY, newRegion);
      } catch (error) {
        console.error("Failed to save region to localStorage:", error);
      }
    }
  };

  return (
    <RegionContext.Provider value={{ region, setRegion }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const context = useContext(RegionContext);
  if (context === undefined) {
    throw new Error("useRegion must be used within a RegionProvider");
  }
  return context;
}

