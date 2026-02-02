"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressStepper } from "@/components/ProgressStepper";
import { ImagePreview } from "@/components/ImagePreview";
import { useWizard } from "@/contexts/WizardContext";
import { mixImages, downloadBase64Image, APIError } from "@/lib/api";

export default function FinalPage() {
  const router = useRouter();
  const {
    originalImagePreview,
    backgroundRemovedImage,
    maskImage,
    backgroundImage,
    finalImage,
    setFinalImage,
    isLoading,
    setLoading,
    resetWizard,
  } = useWizard();

  const [error, setError] = useState<string | null>(null);

  // Redirect if missing required images
  useEffect(() => {
    if (!backgroundRemovedImage || !maskImage || !backgroundImage) {
      router.push("/upload");
      return;
    }

    // Composite images if not already done
    if (!finalImage && !isLoading) {
      compositeImages();
    }
  }, [
    backgroundRemovedImage,
    maskImage,
    backgroundImage,
    finalImage,
    isLoading,
  ]);

  const compositeImages = async () => {
    if (!backgroundRemovedImage || !maskImage || !backgroundImage) return;

    setLoading(true);
    setError(null);

    try {
      const result = await mixImages(
        backgroundRemovedImage,
        maskImage,
        backgroundImage
      );
      setFinalImage(result.final_image);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError("Failed to composite images. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

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

            <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-2xl mx-auto">
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
