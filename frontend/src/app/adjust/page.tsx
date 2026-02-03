"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ProgressStepper } from "@/components/ProgressStepper";
import { useWizard } from "@/contexts/WizardContext";
import { defaultAdjustments } from "@/lib/types";

export default function AdjustPage() {
  const router = useRouter();
  const {
    backgroundRemovedImage,
    editedImage,
    backgroundImage,
    adjustments,
    setAdjustments,
    resetAdjustments,
    nextStep,
  } = useWizard();

  // Use edited image if available, otherwise use background removed image
  const productImage = editedImage || backgroundRemovedImage;

  const previewRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [backgroundAspectRatio, setBackgroundAspectRatio] = useState(1);

  // Load background image to get its aspect ratio
  useEffect(() => {
    if (!backgroundImage) return;
    
    const img = new Image();
    img.onload = () => {
      setBackgroundAspectRatio(img.width / img.height);
    };
    img.src = backgroundImage;
  }, [backgroundImage]);

  // Capture preview size after aspect ratio is set and component is laid out
  useEffect(() => {
    // Small delay to ensure the DOM has updated with the new aspect ratio
    const timer = setTimeout(() => {
      if (previewRef.current && previewRef.current.clientWidth > 0) {
        setAdjustments({
          previewSize: {
            width: previewRef.current.clientWidth,
            height: previewRef.current.clientHeight,
          },
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [backgroundAspectRatio, setAdjustments]);

  // Redirect if no background image
  useEffect(() => {
    if (!productImage || !backgroundImage) {
      router.push("/background");
    }
  }, [productImage, backgroundImage, router]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - adjustments.productPosition.x,
      y: e.clientY - adjustments.productPosition.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const previewSize = previewRef.current
      ? { width: previewRef.current.clientWidth, height: previewRef.current.clientHeight }
      : { width: 0, height: 0 };
    setAdjustments({
      productPosition: {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      },
      previewSize,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleNext = () => {
    // Capture final preview size before navigating
    if (previewRef.current) {
      setAdjustments({
        previewSize: {
          width: previewRef.current.clientWidth,
          height: previewRef.current.clientHeight,
        },
      });
    }
    nextStep();
    router.push("/final");
  };

  const handleBack = () => {
    router.push("/background");
  };

  const handleReset = () => {
    resetAdjustments();
  };

  // Generate CSS filter string for background
  const backgroundFilterStyle = {
    filter: `
      brightness(${adjustments.backgroundEffects.brightness}%)
      contrast(${adjustments.backgroundEffects.contrast}%)
      blur(${adjustments.backgroundEffects.blur}px)
      saturate(${adjustments.backgroundEffects.saturation}%)
    `,
  };

  // Generate CSS transform string for product
  const productTransformStyle = {
    transform: `
      translate(${adjustments.productPosition.x}px, ${adjustments.productPosition.y}px)
      scale(${adjustments.productScale / 100})
      rotate(${adjustments.productRotation}deg)
    `,
    cursor: isDragging ? "grabbing" : "grab",
  };

  if (!productImage || !backgroundImage) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <ProgressStepper />

      <main className="max-w-7xl mx-auto px-4 pb-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">
            Adjust Your Image
          </h1>
          <p className="text-lg text-gray-600">
            Position your product and adjust the background
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Live Preview */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-black">
              <CardHeader>
                <CardTitle className="text-xl text-black">
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  ref={previewRef}
                  className="relative w-full overflow-hidden rounded-lg bg-gray-100"
                  style={{ aspectRatio: backgroundAspectRatio }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {/* Background Layer */}
                  <img
                    src={backgroundImage}
                    alt="Background"
                    className="absolute inset-0 w-full h-full object-contain"
                    style={backgroundFilterStyle}
                    draggable={false}
                  />
                  {/* Product Layer */}
                  <img
                    src={productImage}
                    alt="Product"
                    className="absolute inset-0 w-full h-full object-contain select-none"
                    style={productTransformStyle}
                    onMouseDown={handleMouseDown}
                    draggable={false}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Drag the product to reposition it
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-6 w-full">
            {/* Product Transform Controls */}
            <Card className="border-2 border-black">
              <CardHeader>
                <CardTitle className="text-lg text-black">
                  Product Position
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-black">Position X</Label>
                    <span className="text-sm text-gray-500">
                      {adjustments.productPosition.x}px
                    </span>
                  </div>
                  <Slider
                    value={[adjustments.productPosition.x]}
                    onValueChange={([value]) => {
                      const previewSize = previewRef.current
                        ? { width: previewRef.current.clientWidth, height: previewRef.current.clientHeight }
                        : { width: 0, height: 0 };
                      setAdjustments({
                        productPosition: {
                          ...adjustments.productPosition,
                          x: value,
                        },
                        previewSize,
                      });
                    }}
                    min={-300}
                    max={300}
                    step={1}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-black">Position Y</Label>
                    <span className="text-sm text-gray-500">
                      {adjustments.productPosition.y}px
                    </span>
                  </div>
                  <Slider
                    value={[adjustments.productPosition.y]}
                    onValueChange={([value]) => {
                      const previewSize = previewRef.current
                        ? { width: previewRef.current.clientWidth, height: previewRef.current.clientHeight }
                        : { width: 0, height: 0 };
                      setAdjustments({
                        productPosition: {
                          ...adjustments.productPosition,
                          y: value,
                        },
                        previewSize,
                      });
                    }}
                    min={-300}
                    max={300}
                    step={1}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-black">Scale</Label>
                    <span className="text-sm text-gray-500">
                      {adjustments.productScale}%
                    </span>
                  </div>
                  <Slider
                    value={[adjustments.productScale]}
                    onValueChange={([value]) =>
                      setAdjustments({ productScale: value })
                    }
                    min={50}
                    max={200}
                    step={1}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-black">Rotation</Label>
                    <span className="text-sm text-gray-500">
                      {adjustments.productRotation}°
                    </span>
                  </div>
                  <Slider
                    value={[adjustments.productRotation]}
                    onValueChange={([value]) =>
                      setAdjustments({ productRotation: value })
                    }
                    min={-180}
                    max={180}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Background Effects Controls */}
            <Card className="border-2 border-black">
              <CardHeader>
                <CardTitle className="text-lg text-black">
                  Background Effects
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-black">Brightness</Label>
                    <span className="text-sm text-gray-500">
                      {adjustments.backgroundEffects.brightness}%
                    </span>
                  </div>
                  <Slider
                    value={[adjustments.backgroundEffects.brightness]}
                    onValueChange={([value]) =>
                      setAdjustments({
                        backgroundEffects: {
                          ...adjustments.backgroundEffects,
                          brightness: value,
                        },
                      })
                    }
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-black">Contrast</Label>
                    <span className="text-sm text-gray-500">
                      {adjustments.backgroundEffects.contrast}%
                    </span>
                  </div>
                  <Slider
                    value={[adjustments.backgroundEffects.contrast]}
                    onValueChange={([value]) =>
                      setAdjustments({
                        backgroundEffects: {
                          ...adjustments.backgroundEffects,
                          contrast: value,
                        },
                      })
                    }
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-black">Blur</Label>
                    <span className="text-sm text-gray-500">
                      {adjustments.backgroundEffects.blur}px
                    </span>
                  </div>
                  <Slider
                    value={[adjustments.backgroundEffects.blur]}
                    onValueChange={([value]) =>
                      setAdjustments({
                        backgroundEffects: {
                          ...adjustments.backgroundEffects,
                          blur: value,
                        },
                      })
                    }
                    min={0}
                    max={20}
                    step={0.5}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-black">Saturation</Label>
                    <span className="text-sm text-gray-500">
                      {adjustments.backgroundEffects.saturation}%
                    </span>
                  </div>
                  <Slider
                    value={[adjustments.backgroundEffects.saturation]}
                    onValueChange={([value]) =>
                      setAdjustments({
                        backgroundEffects: {
                          ...adjustments.backgroundEffects,
                          saturation: value,
                        },
                      })
                    }
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={handleReset}
                className="w-full border-2 border-black"
              >
                Reset to Defaults
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 border-2 border-black"
                >
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-black hover:bg-gray-800 text-white"
                >
                  Next: Final
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
