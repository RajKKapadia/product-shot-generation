"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressStepper } from "@/components/ProgressStepper";
import { FileUpload } from "@/components/FileUpload";
import { ImagePreview } from "@/components/ImagePreview";
import { useWizard } from "@/contexts/WizardContext";
import {
  generateBackground,
  fileToBase64,
  APIError,
  type ImageSize,
} from "@/lib/api";

export default function BackgroundPage() {
  const router = useRouter();
  const {
    backgroundRemovedImage,
    editedImage,
    backgroundImage,
    setBackgroundImage,
    isLoading,
    setLoading,
    nextStep,
  } = useWizard();

  // Use edited image if available, otherwise use background removed image
  const productImage = editedImage || backgroundRemovedImage;

  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<ImageSize>("1024x1024");
  const [error, setError] = useState<string | null>(null);
  const [uploadedBg, setUploadedBg] = useState<string | null>(null);
  const [generatedBg, setGeneratedBg] = useState<string | null>(null);

  // Redirect if no product image
  useEffect(() => {
    if (!productImage) {
      router.push("/touchup");
    }
  }, [productImage, router]);

  const handleUploadBackground = async (file: File) => {
    try {
      const preview = await fileToBase64(file);
      setUploadedBg(preview);
      setBackgroundImage(preview);
      setGeneratedBg(null);
      setError(null);
    } catch (err) {
      setError("Failed to load background image");
    }
  };

  const handleGenerateBackground = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt for background generation");
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedBg(null);

    try {
      const result = await generateBackground(prompt, size);
      setGeneratedBg(result.background_image);
      setBackgroundImage(result.background_image);
      setUploadedBg(null);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError("Failed to generate background. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!backgroundImage) {
      setError("Please select or generate a background before continuing");
      return;
    }
    nextStep();
    router.push("/adjust");
  };

  if (!productImage) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <ProgressStepper />

      <main className="max-w-6xl mx-auto px-4 pb-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">
            Choose Background
          </h1>
          <p className="text-lg text-gray-600">
            Upload your own or generate with AI
          </p>
        </div>

        <div className="mb-8">
          <Label className="text-sm text-gray-600 mb-2 block text-center">
            Your Product (Background Removed)
          </Label>
          <ImagePreview
            src={productImage}
            alt="Product with background removed"
            className="max-w-xs mx-auto"
            showCheckered
          />
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="border-2 border-black">
            <CardHeader>
              <CardTitle className="text-xl text-black">
                Upload Background
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFileSelect={handleUploadBackground}
                label="Upload Background Image"
              />
              {uploadedBg && (
                <div className="mt-6">
                  <ImagePreview
                    src={uploadedBg}
                    alt="Uploaded background"
                    label="Selected Background"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-black">
            <CardHeader>
              <CardTitle className="text-xl text-black">
                Generate with AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prompt" className="text-black font-medium">
                  Describe your background
                </Label>
                <Input
                  id="prompt"
                  placeholder="e.g., modern office desk, sunset beach, studio with soft lighting"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="mt-2 border-2 border-black"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="size" className="text-black font-medium">
                  Image Size
                </Label>
                <Select
                  value={size}
                  onValueChange={(value) => setSize(value as ImageSize)}
                  disabled={isLoading}
                >
                  <SelectTrigger
                    id="size"
                    className="mt-2 border-2 border-black"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1024x1024">1024 × 1024 (Square)</SelectItem>
                    <SelectItem value="1024x1792">
                      1024 × 1792 (Portrait)
                    </SelectItem>
                    <SelectItem value="1792x1024">
                      1792 × 1024 (Landscape)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerateBackground}
                disabled={isLoading || !prompt.trim()}
                className="w-full bg-black hover:bg-gray-800 text-white"
              >
                {isLoading ? "Generating..." : "Generate Background"}
              </Button>

              {isLoading && (
                <div className="mt-6">
                  <Skeleton className="w-full aspect-square" />
                </div>
              )}

              {generatedBg && !isLoading && (
                <div className="mt-6">
                  <ImagePreview
                    src={generatedBg}
                    alt="Generated background"
                    label="Generated Background"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="border-2 border-black bg-white p-4 text-center">
              <p className="text-black font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-md mx-auto">
          <Button
            variant="outline"
            onClick={() => router.push("/touchup")}
            className="border-2 border-black w-full sm:w-auto"
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!backgroundImage}
            className="bg-black hover:bg-gray-800 text-white w-full sm:w-auto"
          >
            Next: Adjust
          </Button>
        </div>
      </main>
    </div>
  );
}
