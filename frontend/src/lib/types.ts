export interface BackgroundEffects {
  brightness: number;  // 0-200, default 100
  contrast: number;    // 0-200, default 100
  blur: number;        // 0-20, default 0
  saturation: number;  // 0-200, default 100
}

export interface AdjustmentState {
  productPosition: { x: number; y: number };
  productScale: number;
  productRotation: number;
  backgroundEffects: BackgroundEffects;
}

export const defaultAdjustments: AdjustmentState = {
  productPosition: { x: 0, y: 0 },
  productScale: 100,
  productRotation: 0,
  backgroundEffects: {
    brightness: 100,
    contrast: 100,
    blur: 0,
    saturation: 100,
  },
};

export interface WizardState {
  currentStep: number;
  originalImage: File | null;
  originalImagePreview: string | null;
  backgroundRemovedImage: string | null;
  maskImage: string | null;
  backgroundImage: string | null;
  adjustments: AdjustmentState;
  finalImage: string | null;
  isLoading: boolean;
}

export interface RemoveBackgroundResponse {
  mask: string;
  image_with_alpha: string;
}

export interface BackgroundResponse {
  background_image: string;
  url: string;
}

export interface MixResponse {
  final_image: string;
}

export type ImageSize = "1024x1024" | "1024x1792" | "1792x1024";
