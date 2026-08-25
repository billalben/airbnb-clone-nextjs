"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  homeEditFormSchema,
  homeFormSchema,
  stepFields,
  type HomeFormValues,
} from "@/app/lib/home-schema";
import {
  getSteps,
  StepperHeader,
  type StepKey,
} from "./StepperHeader";
import { CategoryStep, DetailsStep, ImageStep } from "./Steps";
import { LocationStep } from "./LocationStep";

export type HomeFormMode = "create" | "edit";

export type HomeFormDefaults = {
  categoryName?: string | null;
  title?: string | null;
  description?: string | null;
  price?: number | null;
  guests?: string | null;
  bedrooms?: string | null;
  bathrooms?: string | null;
  country?: string | null;
};

export type HomeFormActionResult =
  | { ok: true }
  | { ok: false; fieldErrors?: Record<string, string[]>; message?: string };

export type HomeFormProps = {
  mode: HomeFormMode;
  defaultValues?: HomeFormDefaults;
  action: (
    values: Record<string, string | number | File | undefined>,
  ) => Promise<HomeFormActionResult>;
};

export function HomeFormWizard({
  mode,
  defaultValues,
  action,
}: HomeFormProps) {
  const steps = getSteps(mode);

  const form = useForm<HomeFormValues, unknown, HomeFormValues>({
    resolver: zodResolver(
      mode === "create" ? homeFormSchema : homeEditFormSchema,
    ),
    mode: "onBlur",
    defaultValues: {
      categoryName: defaultValues?.categoryName ?? "",
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      price: defaultValues?.price ?? 10,
      image: undefined,
      guests: Number(defaultValues?.guests) || 1,
      bedrooms: Number(defaultValues?.bedrooms) || 1,
      bathrooms: Number(defaultValues?.bathrooms) || 1,
      country: defaultValues?.country ?? "",
    },
  });

  const [step, setStep] = useState<StepKey>(steps[0].key);
  const [furthest, setFurthest] = useState<StepKey>(steps[0].key);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentIndex = steps.findIndex((s) => s.key === step);
  const furthestIndex = steps.findIndex((s) => s.key === furthest);

  const goToStep = (next: StepKey) => {
    const nextIndex = steps.findIndex((s) => s.key === next);
    if (nextIndex > furthestIndex) return;
    setStep(next);
  };

  const goNext = async () => {
    const fields = stepFields[step];
    const ok = await form.trigger(fields, { shouldFocus: true });
    if (!ok) return;
    const nextIndex = Math.min(currentIndex + 1, steps.length - 1);
    const nextStep = steps[nextIndex].key;
    setStep(nextStep);
    setFurthest((prev) => {
      const prevIndex = steps.findIndex((s) => s.key === prev);
      return nextIndex > prevIndex ? nextStep : prev;
    });
  };

  const goBack = () => {
    const prevIndex = Math.max(currentIndex - 1, 0);
    setStep(steps[prevIndex].key);
  };

  const onSubmit = form.handleSubmit(
    (values) => {
      setServerError(null);
      const payload: Record<string, string | number | File | undefined> = {
        categoryName: values.categoryName,
        title: values.title,
        description: values.description,
        price: values.price,
        image: values.image,
        guests: values.guests,
        bedrooms: values.bedrooms,
        bathrooms: values.bathrooms,
        country: values.country,
      };
      startTransition(async () => {
        const result = await action(payload);
        if (result && result.ok === false) {
          if (result.fieldErrors) {
            for (const [name, messages] of Object.entries(result.fieldErrors)) {
              if (!messages?.length) continue;
              form.setError(name as keyof HomeFormValues, {
                type: "server",
                message: messages[0],
              });
            }
          }
          setServerError(
            result.message ?? "Please review the highlighted fields and try again.",
          );
        }
      });
    },
    () => {
      setServerError("Please fix the errors above before submitting.");
    },
  );

  const isLast = step === steps[steps.length - 1].key;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10">
      <StepperHeader
        steps={steps}
        current={step}
        furthest={furthest}
        onStepClick={goToStep}
      />

      {serverError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm text-destructive"
        >
          {serverError}
        </div>
      )}

      <div className="pb-32">
        {step === "category" ? <CategoryStep form={form} /> : null}
        {step === "image" ? <ImageStep form={form} /> : null}
        {step === "details" ? <DetailsStep form={form} /> : null}
        {step === "location" ? (
          <LocationStep form={form} />
        ) : null}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background container">
        <div className="flex h-24 items-center justify-between">
          <Button
            variant="secondary"
            size="lg"
            nativeButton={false}
            render={<Link href="/" />}
          >
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            {currentIndex > 0 && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={goBack}
                disabled={isPending}
              >
                Back
              </Button>
            )}
            {isLast ? (
              <SubmitButton pending={isPending} mode={mode} />
            ) : (
              <Button
                type="button"
                size="lg"
                onClick={goNext}
                disabled={isPending}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}

function SubmitButton({
  pending,
  mode,
}: {
  pending: boolean;
  mode: HomeFormMode;
}) {
  const label = mode === "edit" ? "Save changes" : "Create listing";
  if (pending) {
    return (
      <Button size="lg" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Saving...
      </Button>
    );
  }
  return (
    <Button type="submit" size="lg">
      {label}
    </Button>
  );
}