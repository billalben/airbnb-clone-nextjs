"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CategoryGrid } from "./CategoryGrid";
import { CounterField } from "./CounterField";
import { ImagePreviewInput } from "./ImagePreviewInput";
import type { HomeFormValues } from "@/app/lib/home-schema";

type FormShape = UseFormReturn<HomeFormValues>;

export function CategoryStep({ form }: { form: FormShape }) {
  const error = form.formState.errors.categoryName?.message;
  return (
    <FieldGroup>
      <Field data-invalid={!!error}>
        <FieldLabel>Which of these best describes your home?</FieldLabel>
        <FieldDescription>
          Pick the category that fits your property the closest.
        </FieldDescription>
        <Controller
          control={form.control}
          name="categoryName"
          render={({ field }) => (
            <CategoryGrid value={field.value ?? ""} onChange={field.onChange} />
          )}
        />
        {error && <FieldError>{error}</FieldError>}
      </Field>
    </FieldGroup>
  );
}

export function ImageStep({ form }: { form: FormShape }) {
  return (
    <FieldGroup>
      <Field>
        <Controller
          control={form.control}
          name="image"
          render={({ field, fieldState }) => (
            <>
              <FieldLabel>Primary photo</FieldLabel>
              <FieldDescription>
                Choose a primary photo for your listing. JPEG, PNG, or WEBP up to
                5MB.
              </FieldDescription>
              <ImagePreviewInput
                inputId="home-form-image"
                value={field.value}
                onChange={field.onChange}
                size="large"
              />
              <FieldError errors={[fieldState.error]} />
            </>
          )}
        />
      </Field>
    </FieldGroup>
  );
}

export function DetailsStep({ form }: { form: FormShape }) {
  return (
    <FieldGroup>
      <Field>
        <Controller
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <>
              <FieldLabel htmlFor="home-form-title">Title</FieldLabel>
              <Input
                {...field}
                id="home-form-title"
                aria-invalid={fieldState.invalid}
                placeholder="Short and simple..."
                autoComplete="off"
                value={field.value ?? ""}
              />
              <FieldError errors={[fieldState.error]} />
            </>
          )}
        />
      </Field>

      <Field>
        <Controller
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <>
              <FieldLabel htmlFor="home-form-description">
                Description
              </FieldLabel>
              <Textarea
                {...field}
                id="home-form-description"
                aria-invalid={fieldState.invalid}
                placeholder="Please describe your home..."
                className="min-h-32"
                value={field.value ?? ""}
              />
              <FieldError errors={[fieldState.error]} />
            </>
          )}
        />
      </Field>

      <Field>
        <Controller
          control={form.control}
          name="price"
          render={({ field, fieldState }) => (
            <>
              <FieldLabel htmlFor="home-form-price">
                Price (per night in USD)
              </FieldLabel>
              <Input
                id="home-form-price"
                type="number"
                inputMode="numeric"
                min={10}
                aria-invalid={fieldState.invalid}
                placeholder="100"
                value={Number.isFinite(field.value) ? field.value : ""}
                onChange={(event) => {
                  const raw = event.target.value;
                  field.onChange(raw === "" ? undefined : Number(raw));
                }}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
              <FieldError errors={[fieldState.error]} />
            </>
          )}
        />
      </Field>

      <Field>
        <FieldLabel>Capacity</FieldLabel>
        <FieldDescription>
          How many guests, bedrooms, and bathrooms does your home have?
        </FieldDescription>
        <div className="grid gap-4 sm:grid-cols-3">
          <CounterRow
            form={form}
            name="guests"
            label="Guests"
            description="How many guests do you want?"
          />
          <CounterRow
            form={form}
            name="bedrooms"
            label="Bedrooms"
            description="How many bedrooms do you have?"
          />
          <CounterRow
            form={form}
            name="bathrooms"
            label="Bathrooms"
            description="How many bathrooms do you have?"
          />
        </div>
      </Field>
    </FieldGroup>
  );
}

function CounterRow({
  form,
  name,
  label,
  description,
}: {
  form: FormShape;
  name: "guests" | "bedrooms" | "bathrooms";
  label: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-col gap-2">
        <div>
          <p className="font-medium underline">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => (
            <CounterField
              id={`home-form-${name}`}
              value={Number(field.value) || 1}
              onChange={field.onChange}
            />
          )}
        />
      </div>
    </div>
  );
}