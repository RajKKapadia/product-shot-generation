import {
  RemoveBackgroundResponse,
  BackgroundResponse,
  MixResponse,
  ImageSize,
} from "./types";

// Re-export types
export type { ImageSize };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "APIError";
  }
}

export async function removeBackground(
  file: File
): Promise<RemoveBackgroundResponse> {
  try {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_BASE_URL}/remove-bg`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: "Failed to remove background",
      }));
      throw new APIError(
        error.detail || "Failed to remove background",
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError("Network error: Unable to connect to the API");
  }
}

export async function generateBackground(
  prompt: string,
  size: ImageSize = "1024x1024"
): Promise<BackgroundResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-bg`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, size }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: "Failed to generate background",
      }));
      throw new APIError(
        error.detail || "Failed to generate background",
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError("Network error: Unable to connect to the API");
  }
}

export async function mixImages(
  imageWithAlpha: string,
  mask: string,
  background: string
): Promise<MixResponse> {
  try {
    // Convert base64 strings to Blobs
    const imageBlob = await base64ToBlob(imageWithAlpha);
    const maskBlob = await base64ToBlob(mask);
    const backgroundBlob = await base64ToBlob(background);

    const formData = new FormData();
    formData.append("image", imageBlob, "image.png");
    formData.append("mask", maskBlob, "mask.png");
    formData.append("background", backgroundBlob, "background.png");

    const response = await fetch(`${API_BASE_URL}/mix`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: "Failed to mix images",
      }));
      throw new APIError(
        error.detail || "Failed to mix images",
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError("Network error: Unable to connect to the API");
  }
}

// Helper function to convert base64 to Blob
async function base64ToBlob(base64: string): Promise<Blob> {
  // Remove data URI prefix if present
  const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;

  const response = await fetch(`data:image/png;base64,${base64Data}`);
  return await response.blob();
}

// Helper function to convert File to base64 for preview
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper function to download base64 image
export function downloadBase64Image(base64: string, filename: string) {
  const link = document.createElement("a");
  link.href = base64;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
