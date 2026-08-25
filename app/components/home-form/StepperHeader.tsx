import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export type StepKey = "category" | "image" | "details" | "location";

const ALL_STEPS: { key: StepKey; label: string }[] = [
  { key: "category", label: "Category" },
  { key: "image", label: "Image" },
  { key: "details", label: "Details" },
  { key: "location", label: "Location" },
];

export type StepperMode = "create" | "edit";

export function getSteps(mode: StepperMode) {
  return mode === "edit"
    ? ALL_STEPS.filter((step) => step.key !== "image")
    : ALL_STEPS;
}

export function StepperHeader({
  steps,
  current,
  furthest,
  onStepClick,
}: {
  steps: { key: StepKey; label: string }[];
  current: StepKey;
  furthest: StepKey;
  onStepClick: (step: StepKey) => void;
}) {
  const currentIndex = steps.findIndex((s) => s.key === current);
  const furthestIndex = steps.findIndex((s) => s.key === furthest);

  return (
    <ol className="container flex items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
      {steps.map((step, index) => {
        const stepIndex = steps.findIndex((s) => s.key === step.key);
        const isActive = step.key === current;
        const isComplete = stepIndex < currentIndex;
        const isReachable = stepIndex <= furthestIndex;
        const isLast = index === steps.length - 1;

        return (
          <li
            key={step.key}
            className={cn("flex flex-1 items-center", isLast && "flex-none")}
          >
            <button
              type="button"
              onClick={() => isReachable && onStepClick(step.key)}
              disabled={!isReachable}
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-full transition-opacity sm:gap-3",
                isReachable
                  ? "cursor-pointer hover:opacity-80"
                  : "cursor-not-allowed opacity-50",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium sm:h-8 sm:w-8 sm:text-sm",
                  isActive &&
                    "border-primary bg-primary text-primary-foreground",
                  isComplete &&
                    !isActive &&
                    "border-primary bg-primary/10 text-primary",
                  !isActive &&
                    !isComplete &&
                    "border-muted text-muted-foreground",
                )}
              >
                {isComplete ? (
                  <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:inline",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </button>
            {!isLast && (
              <span
                className={cn(
                  "mx-2 h-px flex-1 sm:mx-3",
                  stepIndex < currentIndex ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}