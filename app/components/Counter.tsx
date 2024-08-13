"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

export function Counter({ name }: { name: string }) {
  const [amount, setAmount] = useState(1);

  function increase() {
    if (amount >= 10) return;
    setAmount((prev) => prev + 1);
  }

  function decrease() {
    if (amount === 0) return;
    setAmount((prev) => prev - 1);
  }

  return (
    <div className="flex items-center gap-x-2">
      <input type="hidden" name={name} value={amount} />

      <Button
        disabled={amount === 1}
        variant="outline"
        size="icon"
        type="button"
        onClick={decrease}
      >
        <Minus className="h-4 w-4 text-primary" />
      </Button>

      <p className="min-w-5 text-center text-lg font-medium">{amount}</p>

      <Button
        disabled={amount >= 10}
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
