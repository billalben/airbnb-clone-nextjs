"use client";

import { useMemo, useState } from "react";
import type { DateRange, Matcher } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";

type Reservation = {
  startDate: Date;
  endDate: Date;
};

export function SelectCalender({
  reservation,
}: {
  reservation: Reservation[] | undefined;
}) {
  const [range, setRange] = useState<DateRange | undefined>(undefined);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const disabledMatchers = useMemo<Matcher[]>(() => {
    const reserved: Matcher[] = [];
    for (const r of reservation ?? []) {
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      if (start.getTime() === end.getTime()) {
        reserved.push(start);
      } else {
        reserved.push({ from: start, to: end });
      }
    }
    return [{ before: today }, ...reserved];
  }, [reservation, today]);

  const startValue = range?.from?.toISOString() ?? "";
  const endValue = (range?.to ?? range?.from)?.toISOString() ?? "";

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="startDate" value={startValue} />
      <input type="hidden" name="endDate" value={endValue} />
      <Calendar
        mode="range"
        numberOfMonths={1}
        selected={range}
        onSelect={setRange}
        disabled={disabledMatchers}
        captionLayout="dropdown"
        navLayout="around"
        className="w-full rounded-lg border [--cell-size:--spacing(9)]"
        classNames={{
          root: "w-full",
          months: "w-full",
          month: "w-full grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-3",
          button_previous: "size-7 rounded-md justify-self-start",
          month_caption: "w-full justify-self-center px-0",
          button_next: "size-7 rounded-md justify-self-end",
          month_grid: "col-span-3",
          chevron: "size-4",
        }}
      />
      {range?.from ? (
        <p className="text-sm text-muted-foreground">
          {range.to
            ? `${range.from.toLocaleDateString()} → ${range.to.toLocaleDateString()}`
            : `Check-in: ${range.from.toLocaleDateString()} (pick a check-out date)`}
        </p>
      ) : null}
    </div>
  );
}
