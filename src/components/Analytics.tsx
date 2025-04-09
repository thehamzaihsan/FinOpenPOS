"use client";
import { initMixpanel } from "../lib/mixpanelClient";
import { useEffect } from "react";
export default function Analyt() {
  useEffect(() => {
    initMixpanel(); // Initialize Mixpanel
  }, []);

  return null;
}
