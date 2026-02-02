"use client";

import { Separator } from "@/components/ui/separator";
import { useWizard } from "@/contexts/WizardContext";

const steps = [
  { id: 0, name: "Home", label: "Start" },
  { id: 1, name: "Upload", label: "Upload" },
  { id: 2, name: "Background", label: "Background" },
  { id: 3, name: "Final", label: "Complete" },
];

interface ProgressStepperProps {
  maxWidth?: string;
}

export function ProgressStepper({ maxWidth = "max-w-6xl" }: ProgressStepperProps) {
  const { currentStep } = useWizard();

  return (
    <div className={`w-full ${maxWidth} mx-auto py-8 px-4`}>
      <div className="flex items-start justify-center">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            {/* Step circle and label */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold transition-colors ${
                  currentStep === step.id
                    ? "bg-black text-white border-black"
                    : currentStep > step.id
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-black"
                }`}
              >
                {step.id + 1}
              </div>
              <span
                className={`mt-2 text-sm font-medium whitespace-nowrap ${
                  currentStep >= step.id ? "text-black" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            
            {/* Connecting line */}
            {index < steps.length - 1 && (
              <Separator
                className={`w-32 mx-4 h-[2px] ${
                  currentStep > step.id ? "bg-black" : "bg-gray-300"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
