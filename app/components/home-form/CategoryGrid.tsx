import { useId } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { categoryItems } from "@/app/lib/categoryItems";

export function CategoryGrid({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {categoryItems.map((item) => {
        const isSelected = value === item.name;
        return (
          <CategoryCard
            key={item.id}
            name={item.name}
            title={item.title}
            icon={item.icon}
            description={item.description}
            selected={isSelected}
            onSelect={() => onChange(item.name)}
          />
        );
      })}
    </div>
  );
}

function CategoryCard({
  name,
  title,
  icon: Icon,
  description,
  selected,
  onSelect,
}: {
  name: string;
  title: string;
  icon: LucideIcon;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        "block cursor-pointer rounded-xl border-2 transition-colors",
        selected
          ? "border-primary bg-gradient-to-r from-red-200 to-zinc-100"
          : "border-transparent hover:border-muted",
      )}
    >
      <input
        id={id}
        type="radio"
        name="category"
        value={name}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <div className="flex items-center gap-3 p-4">
        <Icon className="h-10 w-10" />
        <div className="flex flex-col">
          <span className="font-medium">{title}</span>
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
      </div>
    </label>
  );
}
