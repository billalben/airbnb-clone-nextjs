"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader } from "@/components/ui/card";
import { Counter } from "./Counter";
import { CategorySelect } from "./CategorySelect";
import { CountrySelect } from "./CountrySelect";
import { UpdateSubmitButton } from "./SubmitButtons";
import { getAllCountries } from "../lib/getCountries";
import { updateHome } from "../actions";
import { useSearchParams } from "next/navigation";

type HomeData = {
  id: string;
  title: string | null;
  description: string | null;
  price: number | null;
  guests: string | null;
  bedrooms: string | null;
  bathrooms: string | null;
  categoryName: string | null;
  country: string | null;
};

export function EditHomeForm({ home }: { home: HomeData }) {
  const params = useSearchParams();
  const showSuccess = params.get("success") === "1";

  const countries = getAllCountries().map((country) => ({
    value: country.value,
    label: `${country.flag} ${country.label} / ${country.region}`,
  }));

  return (
    <form action={updateHome} className="mx-auto mb-36 mt-10 w-3/5 space-y-6">
      <input type="hidden" name="homeId" value={home.id} />

      {showSuccess && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          Changes saved.
        </div>
      )}

      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          name="title"
          type="text"
          required
          minLength={3}
          maxLength={50}
          defaultValue={home.title ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          name="description"
          required
          minLength={10}
          defaultValue={home.description ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label>Price (per night in USD)</Label>
        <Input
          name="price"
          type="number"
          required
          min={10}
          defaultValue={home.price ?? 10}
        />
      </div>

      <div className="space-y-2">
        <Label>Country</Label>
        <CountrySelect
          defaultValue={home.country ?? undefined}
          countries={countries}
        />
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <CategorySelect defaultValue={home.categoryName ?? undefined} />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-y-5">
          <div className="flex flex-wrap items-center justify-between gap-y-2">
            <div>
              <h3 className="font-medium underline">Guests</h3>
              <p className="text-sm text-muted-foreground">
                How many guests do you want?
              </p>
            </div>
            <Counter name="guest" defaultValue={Number(home.guests) || 1} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-y-2">
            <div>
              <h3 className="font-medium underline">Rooms</h3>
              <p className="text-sm text-muted-foreground">
                How many rooms do you have?
              </p>
            </div>
            <Counter name="room" defaultValue={Number(home.bedrooms) || 1} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-y-2">
            <div>
              <h3 className="font-medium underline">Bathrooms</h3>
              <p className="text-sm text-muted-foreground">
                How many bathrooms do you have?
              </p>
            </div>
            <Counter name="bathroom" defaultValue={Number(home.bathrooms) || 1} />
          </div>
        </CardHeader>
      </Card>

      <div className="flex justify-end">
        <UpdateSubmitButton />
      </div>
    </form>
  );
}
