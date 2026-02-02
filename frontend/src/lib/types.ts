export interface WizardState {
  currentStep: number;
  originalImage: File | null;
  originalImagePreview: string | null;
  backgroundRemovedImage: string | null;
  maskImage: string | null;
  backgroundImage: string | null;
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
