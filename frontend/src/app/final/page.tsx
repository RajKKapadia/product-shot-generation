"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressStepper } from "@/components/ProgressStepper";
import { ImagePreview } from "@/components/ImagePreview";
import { useWizard } from "@/contexts/WizardContext";
import { downloadBase64Image } from "@/lib/api";
import { AdjustmentState } from "@/lib/types";

// Helper to load an image from a data URL
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Apply background effects using canvas
const applyBackgroundEffects = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  effects: AdjustmentState["backgroundEffects"]
): void => {
  ctx.filter = `
    brightness(${effects.brightness}%)
    contrast(${effects.contrast}%)
    blur(${effects.blur}px)
    saturate(${effects.saturation}%)
  `;
  ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.filter = "none";
};

// Draw product with transforms
const drawProductWithTransforms = (
  ctx: CanvasRenderingContext2D,
  productImg: HTMLImageElement,
  maskImg: HTMLImageElement,
  adjustments: AdjustmentState
): void => {
  const { width, height } = ctx.canvas;
  const centerX = width / 2;
  const centerY = height / 2;

  ctx.save();

  // Move to center, apply transforms, then draw centered
  ctx.translate(
    centerX + adjustments.productPosition.x,
    centerY + adjustments.productPosition.y
  );
  ctx.rotate((adjustments.productRotation * Math.PI) / 180);
  ctx.scale(adjustments.productScale / 100, adjustments.productScale / 100);

  // Calculate dimensions to fit product in canvas while maintaining aspect ratio
  const scale = Math.min(width / productImg.width, height / productImg.height);
  const drawWidth = productImg.width * scale;
  const drawHeight = productImg.height * scale;

  // Draw product centered at origin (transforms will position it)
  ctx.drawImage(productImg, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

  ctx.restore();
};

export default function FinalPage() {
  const router = useRouter();
  const {
    originalImagePreview,
    backgroundRemovedImage,
    maskImage,
    backgroundImage,
    adjustments,
    finalImage,
    setFinalImage,
    isLoading,
    setLoading,
    resetWizard,
  } = useWizard();

  const [error, setError] = useState<string | null>(null);
  const [hasComposited, setHasComposited] = useState(false);

  const compositeImages = useCallback(async () => {
    if (!backgroundRemovedImage || !maskImage || !backgroundImage) return;

    setLoading(true);
    setError(null);

    try {
      // Load all images
      const [bgImg, productImg, maskImg] = await Promise.all([
        loadImage(backgroundImage),
        loadImage(backgroundRemovedImage),
        loadImage(maskImage),
      ]);

      // Create canvas with background dimensions
      const canvas = document.createElement("canvas");
      canvas.width = bgImg.width;
      canvas.height = bgImg.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      // Step 1: Draw background with effects
      applyBackgroundEffects(ctx, bgImg, adjustments.backgroundEffects);

      // Step 2: Draw product with transforms (product has alpha channel)
      drawProductWithTransforms(ctx, productImg, maskImg, adjustments);

      // Export as data URL
      const finalDataUrl = canvas.toDataURL("image/png");
      setFinalImage(finalDataUrl);
      setHasComposited(true);
    } catch (err) {
      console.error("Compositing error:", err);
      setError("Failed to composite images. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [backgroundRemovedImage, maskImage, backgroundImage, adjustments, setFinalImage, setLoading]);

  // Redirect if missing required images
  useEffect(() => {
    if (!backgroundRemovedImage || !maskImage || !backgroundImage) {
      router.push("/adjust");
      return;
    }

    // Composite images if not already done
    if (!hasComposited && !isLoading) {
      compositeImages();
    }
  }, [
    backgroundRemovedImage,
    maskImage,
    backgroundImage,
    hasComposited,
    isLoading,
    compositeImages,
    router,
  ]);

  const handleDownload = () => {
    if (finalImage) {
      const timestamp = new Date().toISOString().split("T")[0];
      downloadBase64Image(finalImage, `product-shot-${timestamp}.png`);
    }
  };

  const handleStartOver = () => {
    resetWizard();
    router.push("/");
  };

  if (!backgroundRemovedImage || !backgroundImage) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <ProgressStepper maxWidth="max-w-7xl" />

      <main className="max-w-7xl mx-auto px-4 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-2">
            Your Professional Product Shot
          </h1>
          <p className="text-lg text-gray-600">
            Review and download your final image
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Skeleton className="w-full aspect-square" />
            <Skeleton className="w-full aspect-square" />
            <Skeleton className="w-full aspect-square" />
          </div>
        ) : error ? (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="border-2 border-black bg-white p-8 text-center">
              <p className="text-black font-medium text-lg mb-4">{error}</p>
              <Button
                onClick={compositeImages}
                className="bg-black hover:bg-gray-800 text-white"
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <ImagePreview
                src={originalImagePreview}
                alt="Original image"
                label="Original Image"
              />
              <ImagePreview
                src={backgroundRemovedImage}
                alt="Background removed"
                label="Background Removed"
                showCheckered
              />
              <ImagePreview
                src={finalImage}
                alt="Final composite"
                label="Final Result"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-3xl mx-auto">
              <Button
                variant="outline"
                onClick={() => router.push("/adjust")}
                className="border-2 border-black text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto w-full sm:w-auto"
              >
                Back to Adjust
              </Button>
              <Button
                variant="outline"
                onClick={handleStartOver}
                className="border-2 border-black text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto w-full sm:w-auto"
              >
                Start Over
              </Button>
              <Button
                onClick={handleDownload}
                disabled={!finalImage}
                className="bg-black hover:bg-gray-800 text-white text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto w-full sm:w-auto"
              >
                Download Final Image
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
