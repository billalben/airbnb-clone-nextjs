import { categoryItems } from "../lib/categoryItems";

export function CategoryShowcase({ categoryName }: { categoryName: string }) {
  const category = categoryItems.find((item) => item.name === categoryName);
  const Icon = category?.icon;

  return (
    <div className="flex items-center">
      {Icon ? <Icon className="h-11 w-11" /> : null}

      <div className="ml-4 flex flex-col">
        <h3 className="font-medium">{category?.title}</h3>
        <p className="text-sm text-muted-foreground">{category?.description}</p>
      </div>
    </div>
  );
}
