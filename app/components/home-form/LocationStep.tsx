"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import type { HomeFormValues } from "@/app/lib/home-schema";
import { LocationMapPreview } from "./LocationMapPreview";
import { CountryCombobox } from "../CountryCombobox";

type FormShape = UseFormReturn<HomeFormValues>;

export function LocationStep({
  form,
}: {
  form: FormShape;
  countries?: { value: string; label: string }[];
}) {
  const error = form.formState.errors.country?.message;
  return (
    <FieldGroup>
      <Field data-invalid={!!error}>
        <Controller
          control={form.control}
          name="country"
          render={({ field, fieldState }) => (
            <>
              <FieldLabel htmlFor="home-form-country">
                Where is your home located?
              </FieldLabel>
              <FieldDescription>
                Pick the country. We&apos;ll use this for search and filtering.
              </FieldDescription>
              <CountryCombobox
                id="home-form-country"
                value={field.value || null}
                onValueChange={(v) => field.onChange(v ?? field.value)}
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </>
          )}
        />
      </Field>
      {fieldValue(form, "country") ? (
        <LocationMapPreview country={fieldValue(form, "country") ?? ""} />
      ) : null}
    </FieldGroup>
  );
}

function fieldValue(form: FormShape, name: keyof HomeFormValues) {
  return (form.watch(name) as string | undefined) ?? "";
}