"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Image from "next/image";

interface ImagePreviewProps {
  src: string | null;
  alt: string;
  label?: string;
  className?: string;
  showCheckered?: boolean;
}

export function ImagePreview({
  src,
  alt,
  label,
  className = "",
  showCheckered = false,
}: ImagePreviewProps) {
  // Don't render if src is empty or null
  if (!src) {
    return null;
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <Card className="border-2 border-black overflow-hidden">
        <CardContent className="p-0">
          <div
            className={`relative w-full aspect-square ${showCheckered ? "checkered-bg" : "bg-white"}`}
          >
            <Image
              src={src}
              alt={alt}
              fill
              className="object-contain p-4"
              unoptimized
            />
          </div>
        </CardContent>
      </Card>
      {label && (
        <Label className="mt-2 text-center text-sm font-medium text-black block w-full">
          {label}
        </Label>
      )}
    </div>
  );
}
