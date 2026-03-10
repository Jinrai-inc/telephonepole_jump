"use client";

import React from "react";
import { Check } from "lucide-react";

interface Step {
  label: string;
  icon?: React.ReactNode;
}

interface StepNavProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function StepNav({ steps, currentStep, onStepClick }: StepNavProps) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-2">
      {steps.map((step, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;

        return (
          <React.Fragment key={i}>
            <button
              onClick={() => onStepClick?.(i)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                isCurrent
                  ? "bg-accent-soft text-accent"
                  : isCompleted
                  ? "text-accent"
                  : "text-text-dim"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                  isCurrent
                    ? "border-accent bg-accent text-bg"
                    : isCompleted
                    ? "border-accent bg-accent/20 text-accent"
                    : "border-text-dim"
                }`}
              >
                {isCompleted ? <Check size={14} /> : i + 1}
              </div>
              <span className="hidden md:inline">{step.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={`w-8 h-px ${isCompleted ? "bg-accent" : "bg-border"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
