"use client";

import * as React from "react";
import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { getAllCountries } from "@/app/lib/getCountries";
import { cn } from "@/lib/utils";

type Country = {
  value: string;
  label: string;
  flag: string;
  region: string;
};

function buildLabel(c: Country) {
  return `${c.flag} ${c.label} / ${c.region}`;
}

export function CountryCombobox({
  name,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select a country",
  id,
  className,
  "aria-invalid": ariaInvalid,
}: {
  name?: string;
  value?: string | null;
  defaultValue?: string;
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  "aria-invalid"?: boolean;
}) {
  const countries = React.useMemo<Country[]>(
    () =>
      getAllCountries().map((c) => ({
        value: c.value,
        label: c.label,
        flag: c.flag,
        region: c.region,
      })),
    [],
  );

  const findByValue = React.useCallback(
    (v: string | null | undefined): Country | null =>
      v ? (countries.find((c) => c.value === v) ?? null) : null,
    [countries],
  );

  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<Country | null>(
    findByValue(defaultValue),
  );
  const current = isControlled ? findByValue(value) : internal;

  const handleChange = React.useCallback(
    (v: Country | null) => {
      if (!isControlled) setInternal(v);
      onValueChange?.(v?.value ?? null);
    },
    [isControlled, onValueChange],
  );

  const filter = React.useCallback((item: Country, query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return buildLabel(item).toLowerCase().includes(q);
  }, []);

  const itemToStringLabel = React.useCallback(
    (c: Country | null) => (c ? buildLabel(c) : ""),
    [],
  );
  const itemToStringValue = React.useCallback(
    (c: Country | null) => c?.value ?? "",
    [],
  );

  return (
    <>
      {name ? (
        <input type="hidden" name={name} value={current?.value ?? ""} />
      ) : null}
      <Combobox.Root
        items={countries}
        value={current}
        onValueChange={handleChange}
        filter={filter}
        itemToStringLabel={itemToStringLabel}
        itemToStringValue={itemToStringValue}
        isItemEqualToValue={(a, b) => a?.value === b?.value}
      >
        <div className={cn("relative", className)}>
          <Combobox.Input
            id={id}
            placeholder={placeholder}
            aria-invalid={ariaInvalid}
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-transparent py-2 pr-16 pl-3 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
            )}
          />
          <div className="absolute top-1/2 right-1 flex -translate-y-1/2 items-center gap-0.5">
            {current ? (
              <Combobox.Clear
                aria-label="Clear selection"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </Combobox.Clear>
            ) : null}
            <Combobox.Trigger
              aria-label="Open country list"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronsUpDown className="h-4 w-4" />
            </Combobox.Trigger>
          </div>
        </div>
        <Combobox.Portal>
          <Combobox.Positioner
            sideOffset={4}
            className="isolate z-50 outline-none"
          >
            <Combobox.Popup className="relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
              <Combobox.List className="p-1">
                <Combobox.Collection>
                  {(item: Country) => (
                    <Combobox.Item
                      key={item.value}
                      value={item}
                      className="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
                    >
                      <Combobox.ItemIndicator className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
                        <Check className="h-4 w-4" />
                      </Combobox.ItemIndicator>
                      <span className="flex-1 truncate">
                        {buildLabel(item)}
                      </span>
                    </Combobox.Item>
                  )}
                </Combobox.Collection>
              </Combobox.List>
              <Combobox.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
                No country found.
              </Combobox.Empty>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </>
  );
}
