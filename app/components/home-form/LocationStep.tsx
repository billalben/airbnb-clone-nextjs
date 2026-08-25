"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HomeFormValues } from "@/app/lib/home-schema";
import { LocationMapPreview } from "./LocationMapPreview";

type FormShape = UseFormReturn<HomeFormValues>;

export function LocationStep({
  form,
  countries,
}: {
  form: FormShape;
  countries: { value: string; label: string }[];
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
              <Select
                name={field.name}
                value={field.value ?? ""}
                onValueChange={(value) => field.onChange(value as string)}
              >
                <SelectTrigger
                  id="home-form-country"
                  className="w-full"
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Countries</SelectLabel>
                    {countries.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
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