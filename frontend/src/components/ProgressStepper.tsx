"use client";

import { useWizard } from "@/contexts/WizardContext";

const steps = [
  { id: 0, name: "Home", label: "Start" },
  { id: 1, name: "Upload", label: "Upload" },
  { id: 2, name: "Background", label: "Background" },
  { id: 3, name: "Adjust", label: "Adjust" },
  { id: 4, name: "Final", label: "Complete" },
];

interface ProgressStepperProps {
  maxWidth?: string;
}

export function ProgressStepper({ maxWidth = "max-w-6xl" }: ProgressStepperProps) {
  const { currentStep } = useWizard();

  return (
    <div className={`flex justify-center w-full ${maxWidth} mx-auto py-8 px-4 mb-8`}>
      <div className="flex w-full">
        {steps.map((step, index) => (
          <div key={step.id} className="relative flex flex-1 flex-col items-center">
            {/* Connecting line */}
            {index < steps.length - 1 && (
              <span
                className={`absolute left-1/2 top-5 h-[2px] w-full -translate-y-1/2 ${
                  currentStep > step.id ? "bg-black" : "bg-gray-300"
                }`}
              />
            )}

            {/* Step circle and label */}
            <div
              className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold transition-colors ${
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
        ))}
      </div>
    </div>
  );
}
