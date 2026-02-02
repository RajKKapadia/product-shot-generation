"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/upload");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <main className="max-w-3xl w-full py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-black mb-4">
            Product Shot Generation
          </h1>
          <p className="text-xl text-gray-600">
            Create professional product shots with AI-powered background removal
            and generation
          </p>
        </div>

        <Card className="border-2 border-black mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-black">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-black mb-1">
                    Upload Your Product Image
                  </h3>
                  <p className="text-gray-600">
                    Upload your product image and let our AI automatically
                    remove the background with precision.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-black mb-1">
                    Choose a New Background
                  </h3>
                  <p className="text-gray-600">
                    Upload your own background image or use AI to generate a
                    custom background based on your description.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-black mb-1">
                    Download Your Professional Shot
                  </h3>
                  <p className="text-gray-600">
                    Review the final composite image and download your
                    professional product shot instantly.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="text-lg px-12 py-6 h-auto bg-black hover:bg-gray-800 text-white"
          >
            Get Started
          </Button>
        </div>
      </main>
    </div>
  );
}
