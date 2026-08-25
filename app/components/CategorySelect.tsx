"use client";

import { Card, CardHeader } from "@/components/ui/card";
import { categoryItems } from "../lib/categoryItems";
import { useState } from "react";

export function CategorySelect({ defaultValue }: { defaultValue?: string }) {
  const initial = defaultValue ?? categoryItems[0].name;
  const [selected, setSelected] = useState<string>(initial);

  return (
    <div className="grid w-full gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <input type="hidden" name="categoryName" value={selected} />
      {categoryItems.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            className="cursor-pointer"
            role="button"
            aria-pressed={selected === item.name}
          >
            <Card
              className={`border-2 ${selected === item.name ? "border-primary bg-primary/10" : ""}`}
              onClick={() => setSelected(item.name)}
            >
              <CardHeader>
                <Icon className="h-8 w-8" />
                <h3 className="font-medium">{item.title}</h3>
              </CardHeader>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
