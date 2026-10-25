"use client";

import { Button } from "@/components/ui/button";
import { COUNTER_MAX, COUNTER_MIN } from "@/app/lib/counter-limits";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

export function Counter({
  name,
  defaultValue = COUNTER_MIN,
}: {
  name: string;
  defaultValue?: number;
}) {
  const [amount, setAmount] = useState(defaultValue);

  function increase() {
    if (amount >= COUNTER_MAX) return;
    setAmount((prev) => prev + 1);
  }

  function decrease() {
    if (amount <= COUNTER_MIN) return;
    setAmount((prev) => prev - 1);
  }

  return (
    <div className="flex items-center gap-x-2">
      <input type="hidden" name={name} value={amount} />

      <Button
        disabled={amount <= COUNTER_MIN}
        variant="outline"
        size="icon"
        type="button"
        onClick={decrease}
      >
        <Minus className="h-4 w-4 text-primary" />
      </Button>

      <p className="min-w-5 text-center text-lg font-medium">{amount}</p>

      <Button
        disabled={amount >= COUNTER_MAX}
        variant="outline"
        size="icon"
        type="button"
        onClick={increase}
      >
        <Plus className="h-4 w-4 text-primary" />
      </Button>
    </div>
  );
}
