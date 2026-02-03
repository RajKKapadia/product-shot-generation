"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ProgressStepper } from "@/components/ProgressStepper";
import { useWizard } from "@/contexts/WizardContext";

export default function TouchupPage() {
  const router = useRouter();
  const {
    backgroundRemovedImage,
    editedImage,
    setEditedImage,
    nextStep,
  } = useWizard();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [eraserSize, setEraserSize] = useState(25);
  const [zoom, setZoom] = useState(100);

  // Use refs for drawing state to avoid re-renders during drawing
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const canvasRectRef = useRef<DOMRect | null>(null);
  const eraserSizeRef = useRef(eraserSize);

  // Keep eraserSizeRef in sync
  useEffect(() => {
    eraserSizeRef.current = eraserSize;
  }, [eraserSize]);

  // Store original image data for reset
  const originalImageDataRef = useRef<ImageData | null>(null);

  // Update cached canvas rect
  const updateCanvasRect = useCallback(() => {
    if (canvasRef.current) {
      canvasRectRef.current = canvasRef.current.getBoundingClientRect();
    }
  }, []);

  // Redirect if no background removed image
  useEffect(() => {
    if (!backgroundRemovedImage) {
      router.push("/upload");
    }
  }, [backgroundRemovedImage, router]);

  // Initialize canvas with the image
  useEffect(() => {
    if (!backgroundRemovedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Store original image data for reset (only from backgroundRemovedImage)
      if (!editedImage) {
        originalImageDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }
      
      // Update canvas rect after image loads
      updateCanvasRect();
    };
    img.src = editedImage || backgroundRemovedImage;
  }, [backgroundRemovedImage, editedImage, updateCanvasRect]);

  // Store original on first load
  useEffect(() => {
    if (!backgroundRemovedImage || originalImageDataRef.current) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (tempCtx) {
        tempCtx.drawImage(img, 0, 0);
        originalImageDataRef.current = tempCtx.getImageData(0, 0, img.width, img.height);
      }
    };
    img.src = backgroundRemovedImage;
  }, [backgroundRemovedImage]);

  // Update rect on zoom change
  useEffect(() => {
    // Small delay to let CSS update
    const timer = setTimeout(updateCanvasRect, 50);
    return () => clearTimeout(timer);
  }, [zoom, updateCanvasRect]);

  // Get canvas coordinates from mouse/touch event (optimized - uses cached rect)
  const getCanvasCoords = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!canvasRef.current || !canvasRectRef.current) return null;

    const canvas = canvasRef.current;
    const rect = canvasRectRef.current;

    // Position relative to the canvas element on screen
    const displayX = clientX - rect.left;
    const displayY = clientY - rect.top;

    // Check if within canvas bounds
    if (displayX < 0 || displayX > rect.width || displayY < 0 || displayY > rect.height) {
      return null;
    }

    // Scale from display coordinates to actual canvas pixel coordinates
    const x = (displayX / rect.width) * canvas.width;
    const y = (displayY / rect.height) * canvas.height;

    return { x, y };
  }, []);

  // Get canvas context (cached)
  const getContext = useCallback(() => {
    if (!canvasRef.current) return null;
    return canvasRef.current.getContext("2d");
  }, []);

  // Erase at position with line interpolation for smooth erasing
  const eraseAt = useCallback((x: number, y: number, prevX?: number, prevY?: number) => {
    const ctx = getContext();
    if (!ctx) return;

    const size = eraserSizeRef.current;

    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (prevX !== undefined && prevY !== undefined) {
      // Draw a line from previous point to current point
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      // Single point - draw a circle
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }, [getContext]);

  // Update cursor position directly via DOM (no React re-render)
  const updateCursor = useCallback((clientX: number, clientY: number) => {
    if (!cursorRef.current || !canvasRectRef.current) return;
    
    const rect = canvasRectRef.current;
    const displayX = clientX - rect.left;
    const displayY = clientY - rect.top;
    
    // Check if within canvas bounds
    if (displayX < 0 || displayX > rect.width || displayY < 0 || displayY > rect.height) {
      cursorRef.current.style.display = "none";
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const displayRatio = rect.width / canvas.width;
    const cursorSize = eraserSizeRef.current * displayRatio;
    
    cursorRef.current.style.display = "block";
    cursorRef.current.style.left = `${displayX}px`;
    cursorRef.current.style.top = `${displayY}px`;
    cursorRef.current.style.width = `${cursorSize}px`;
    cursorRef.current.style.height = `${cursorSize}px`;
  }, []);

  // Mouse/Touch handlers (optimized - using refs to avoid re-renders)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    
    // Update canvas rect at start of drawing
    updateCanvasRect();
    
    // Capture pointer for smooth tracking
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;

    isDrawingRef.current = true;
    lastPointRef.current = coords;
    eraseAt(coords.x, coords.y);
    updateCursor(e.clientX, e.clientY);
  }, [getCanvasCoords, eraseAt, updateCanvasRect, updateCursor]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    updateCursor(e.clientX, e.clientY);

    if (!isDrawingRef.current) return;
    
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;

    const lastPoint = lastPointRef.current;
    if (lastPoint) {
      eraseAt(coords.x, coords.y, lastPoint.x, lastPoint.y);
    } else {
      eraseAt(coords.x, coords.y);
    }
    lastPointRef.current = coords;
  }, [getCanvasCoords, eraseAt, updateCursor]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  const handlePointerLeave = useCallback(() => {
    if (cursorRef.current) {
      cursorRef.current.style.display = "none";
    }
  }, []);

  // Reset to original image
  const handleReset = useCallback(() => {
    if (!canvasRef.current || !originalImageDataRef.current) return;

    const ctx = getContext();
    if (!ctx) return;

    ctx.putImageData(originalImageDataRef.current, 0, 0);
    setZoom(100);
  }, [getContext]);

  // Save and proceed
  const handleNext = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");
    setEditedImage(dataUrl);
    nextStep();
    router.push("/background");
  }, [setEditedImage, nextStep, router]);

  // Skip touch-up (use original)
  const handleSkip = useCallback(() => {
    if (backgroundRemovedImage) {
      setEditedImage(backgroundRemovedImage);
    }
    nextStep();
    router.push("/background");
  }, [backgroundRemovedImage, setEditedImage, nextStep, router]);

  const handleBack = useCallback(() => {
    router.push("/upload");
  }, [router]);

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(300, prev + 25));
  const handleZoomOut = () => setZoom((prev) => Math.max(50, prev - 25));
  const handleZoomReset = () => setZoom(100);

  if (!backgroundRemovedImage) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <ProgressStepper />

      <main className="max-w-7xl mx-auto px-4 pb-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">
            Touch-up Your Product
          </h1>
          <p className="text-lg text-gray-600">
            Erase any remaining background parts
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Canvas Area */}
          <div className="lg:col-span-3">
            <Card className="border-2 border-black">
              <CardHeader>
                <CardTitle className="text-xl text-black">
                  Eraser Canvas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  ref={containerRef}
                  className="relative w-full overflow-auto rounded-lg"
                  style={{
                    maxHeight: "70vh",
                    backgroundImage: `
                      linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
                      linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
                      linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)
                    `,
                    backgroundSize: "20px 20px",
                    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                  }}
                >
                  <div 
                    className="relative inline-block"
                    style={{ 
                      cursor: "none",
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      className="block touch-none"
                      style={{
                        width: `${zoom}%`,
                        height: "auto",
                        imageRendering: zoom > 100 ? "pixelated" : "auto",
                      }}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerLeave}
                      onContextMenu={(e) => e.preventDefault()}
                    />
                    
                    {/* Eraser cursor indicator (positioned via ref for performance) */}
                    <div
                      ref={cursorRef}
                      className="absolute pointer-events-none border-2 border-black rounded-full"
                      style={{
                        display: "none",
                        transform: "translate(-50%, -50%)",
                        backgroundColor: "rgba(255,255,255,0.3)",
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                  <p className="text-sm text-gray-500">
                    Click and drag to erase. Use zoom controls to see details.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomOut}
                      className="border-black"
                    >
                      -
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomReset}
                      className="border-black min-w-[80px]"
                    >
                      {zoom}%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomIn}
                      className="border-black"
                    >
                      +
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Eraser Controls */}
            <Card className="border-2 border-black">
              <CardHeader>
                <CardTitle className="text-lg text-black">
                  Eraser Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-black">Eraser Size</Label>
                    <span className="text-sm text-gray-500">
                      {eraserSize}px
                    </span>
                  </div>
                  <Slider
                    value={[eraserSize]}
                    onValueChange={([value]) => setEraserSize(value)}
                    min={5}
                    max={100}
                    step={1}
                  />
                </div>

                {/* Size presets */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEraserSize(10)}
                    className={`flex-1 border-black ${eraserSize === 10 ? "bg-black text-white" : ""}`}
                  >
                    S
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEraserSize(25)}
                    className={`flex-1 border-black ${eraserSize === 25 ? "bg-black text-white" : ""}`}
                  >
                    M
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEraserSize(50)}
                    className={`flex-1 border-black ${eraserSize === 50 ? "bg-black text-white" : ""}`}
                  >
                    L
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEraserSize(100)}
                    className={`flex-1 border-black ${eraserSize === 100 ? "bg-black text-white" : ""}`}
                  >
                    XL
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Zoom Controls */}
            <Card className="border-2 border-black">
              <CardHeader>
                <CardTitle className="text-lg text-black">
                  View Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-black">Zoom Level</Label>
                    <span className="text-sm text-gray-500">
                      {zoom}%
                    </span>
                  </div>
                  <Slider
                    value={[zoom]}
                    onValueChange={([value]) => setZoom(value)}
                    min={50}
                    max={300}
                    step={10}
                  />
                </div>

                <Button
                  variant="outline"
                  onClick={handleZoomReset}
                  className="w-full border-black"
                >
                  Reset Zoom
                </Button>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={handleReset}
                className="w-full border-2 border-black"
              >
                Reset to Original
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
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1 border-2 border-black"
                >
                  Skip
                </Button>
              </div>
              <Button
                onClick={handleNext}
                className="w-full bg-black hover:bg-gray-800 text-white"
              >
                Next: Background
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
