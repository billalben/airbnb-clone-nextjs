import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COUNTER_MAX, COUNTER_MIN } from "@/app/lib/home-schema";

export function CounterField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: number;
  onChange: (next: number) => void;
}) {
  const decrease = () => onChange(Math.max(COUNTER_MIN, value - 1));
  const increase = () => onChange(Math.min(COUNTER_MAX, value + 1));

  return (
    <div className="flex items-center gap-x-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={decrease}
        disabled={value <= COUNTER_MIN}
        aria-label="Decrease"
      >
        <Minus className="h-4 w-4 text-primary" />
      </Button>
      <p
        id={id}
        aria-live="polite"
        className="min-w-5 text-center text-lg font-medium"
      >
        {value}
      </p>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={increase}
        disabled={value >= COUNTER_MAX}
        aria-label="Increase"
      >
        <Plus className="h-4 w-4 text-primary" />
      </Button>
    </div>
  );
}