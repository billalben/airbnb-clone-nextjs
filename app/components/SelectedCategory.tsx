"use client";

import { Card, CardHeader } from "@/components/ui/card";
import { categoryItems } from "../lib/categoryItems";
import Image from "next/image";
import { useMemo, useState } from "react";

export function SelectCategory() {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categoryItems[0].name,
  );
  const categoryList = useMemo(() => categoryItems, []);

  return (
    <div className="mx-auto mb-36 mt-10 grid w-3/5 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <input
        type="hidden"
        name="categoryName"
        value={selectedCategory as string}
      />
      {categoryList.map((item) => (
        <div
          key={item.id}
          className="cursor-pointer"
          role="button"
          aria-pressed={selectedCategory === item.name}
        >
          <Card
            className={`border-2 ${selectedCategory === item.name ? "border-primary bg-gradient-to-r from-red-200 to-zinc-100" : ""}`}
            onClick={() => setSelectedCategory(item.name)}
          >
            <CardHeader>
              <Image
                src={item.imageUrl}
                alt={item.name}
                height={32}
                width={32}
                className="h-8 w-8"
              />

              <h3 className="font-medium">{item.title}</h3>
            </CardHeader>
          </Card>
        </div>
      ))}
    </div>
  );
}
