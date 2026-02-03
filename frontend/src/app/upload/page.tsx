"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressStepper } from "@/components/ProgressStepper";
import { FileUpload } from "@/components/FileUpload";
import { ImagePreview } from "@/components/ImagePreview";
import { useWizard } from "@/contexts/WizardContext";
import { removeBackground, fileToBase64, APIError } from "@/lib/api";

export default function UploadPage() {
  const router = useRouter();
  const {
    originalImage,
    originalImagePreview,
    backgroundRemovedImage,
    setOriginalImage,
    setBackgroundRemovedImage,
    isLoading,
    setLoading,
    nextStep,
  } = useWizard();

  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (originalImagePreview) {
      setLocalPreview(originalImagePreview);
    }
  }, [originalImagePreview]);

  const handleFileSelect = async (file: File) => {
    try {
      const preview = await fileToBase64(file);
      setOriginalImage(file, preview);
      setLocalPreview(preview);
      setError(null);
    } catch (err) {
      setError("Failed to load image preview");
    }
  };

  const handleRemoveBackground = async () => {
    if (!originalImage) return;

    setLoading(true);
    setError(null);

    try {
      const result = await removeBackground(originalImage);
      setBackgroundRemovedImage(result.image_with_alpha, result.mask);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError("Failed to remove background. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    nextStep();
    router.push("/touchup");
  };

  return (
    <div className="min-h-screen bg-white">
      <ProgressStepper />

      <main className="max-w-6xl mx-auto px-4 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-2">
            Upload Your Product Image
          </h1>
          <p className="text-lg text-gray-600">
            Upload an image and remove its background
          </p>
        </div>

        {!localPreview ? (
          <div className="max-w-2xl mx-auto">
            <FileUpload
              onFileSelect={handleFileSelect}
              label="Upload Product Image"
            />
          </div>
        ) : (
          <div className="space-y-8">
            {!backgroundRemovedImage ? (
              <div>
                <ImagePreview
                  src={localPreview}
                  alt="Original product image"
                  label="Original Image"
                  className="max-w-md mx-auto"
                />

                <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 w-full max-w-md mx-auto">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setLocalPreview(null);
                      setOriginalImage(null as any, null as any);
                    }}
                    className="border-2 border-black w-full sm:w-auto"
                  >
                    Choose Different Image
                  </Button>
                  <Button
                    onClick={handleRemoveBackground}
                    disabled={isLoading}
                    className="bg-black hover:bg-gray-800 text-white w-full sm:w-auto"
                  >
                    {isLoading ? "Processing..." : "Remove Background"}
                  </Button>
                </div>
              </div>
            ) : isLoading ? (
              <div className="grid md:grid-cols-2 gap-8">
                <Skeleton className="w-full aspect-square" />
                <Skeleton className="w-full aspect-square" />
              </div>
            ) : (
              <div>
                <div className="grid md:grid-cols-2 gap-8">
                  <ImagePreview
                    src={localPreview}
                    alt="Original product image"
                    label="Original Image"
                  />
                  <ImagePreview
                    src={backgroundRemovedImage}
                    alt="Background removed"
                    label="Background Removed"
                    showCheckered
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 w-full max-w-md mx-auto">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setLocalPreview(null);
                      setOriginalImage(null as any, null as any);
                      setBackgroundRemovedImage(null as any, null as any);
                    }}
                    className="border-2 border-black w-full sm:w-auto"
                  >
                    Start Over
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="bg-black hover:bg-gray-800 text-white w-full sm:w-auto"
                  >
                    Next: Touch-up
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto mt-4">
            <div className="border-2 border-black bg-white p-4 text-center">
              <p className="text-black font-medium">{error}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
