"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { WizardState, AdjustmentState, defaultAdjustments } from "@/lib/types";

interface WizardContextType extends WizardState {
  setOriginalImage: (file: File, preview: string) => void;
  setBackgroundRemovedImage: (image: string, mask: string) => void;
  setBackgroundImage: (image: string) => void;
  setAdjustments: (adjustments: Partial<AdjustmentState>) => void;
  resetAdjustments: () => void;
  setFinalImage: (image: string) => void;
  setLoading: (isLoading: boolean) => void;
  nextStep: () => void;
  previousStep: () => void;
  resetWizard: () => void;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

const initialState: WizardState = {
  currentStep: 0,
  originalImage: null,
  originalImagePreview: null,
  backgroundRemovedImage: null,
  maskImage: null,
  backgroundImage: null,
  adjustments: { ...defaultAdjustments },
  finalImage: null,
  isLoading: false,
};

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WizardState>(initialState);

  const setOriginalImage = (file: File, preview: string) => {
    setState((prev) => ({
      ...prev,
      originalImage: file,
      originalImagePreview: preview,
    }));
  };

  const setBackgroundRemovedImage = (image: string, mask: string) => {
    setState((prev) => ({
      ...prev,
      backgroundRemovedImage: image,
      maskImage: mask,
    }));
  };

  const setBackgroundImage = (image: string) => {
    setState((prev) => ({
      ...prev,
      backgroundImage: image,
    }));
  };

  const setAdjustments = (adjustments: Partial<AdjustmentState>) => {
    setState((prev) => ({
      ...prev,
      adjustments: {
        ...prev.adjustments,
        ...adjustments,
        backgroundEffects: {
          ...prev.adjustments.backgroundEffects,
          ...(adjustments.backgroundEffects || {}),
        },
      },
    }));
  };

  const resetAdjustments = () => {
    setState((prev) => ({
      ...prev,
      adjustments: { ...defaultAdjustments },
    }));
  };

  const setFinalImage = (image: string) => {
    setState((prev) => ({
      ...prev,
      finalImage: image,
    }));
  };

  const setLoading = (isLoading: boolean) => {
    setState((prev) => ({
      ...prev,
      isLoading,
    }));
  };

  const nextStep = () => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, 4),
    }));
  };

  const previousStep = () => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0),
    }));
  };

  const resetWizard = () => {
    setState(initialState);
  };

  const value: WizardContextType = {
    ...state,
    setOriginalImage,
    setBackgroundRemovedImage,
    setBackgroundImage,
    setAdjustments,
    resetAdjustments,
    setFinalImage,
    setLoading,
    nextStep,
    previousStep,
    resetWizard,
  };

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}
