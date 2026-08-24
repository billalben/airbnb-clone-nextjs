"use client";

import { createLocation } from "@/app/actions";
import { CreationBottomBar } from "@/app/components/CreationBottomBar";
import { getAllCountries } from "@/app/lib/getCountries";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import { use, useState } from "react";

const LazyMap = dynamic(() => import("@/app/components/Map"), {
  ssr: false,
  loading: () => <Skeleton className="h-[50vh] w-full" />,
});

export default function AddressRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const countries = getAllCountries().map((country) => ({
    value: country.value,
    label: `${country.flag} ${country.label} / ${country.region}`,
  }));
  const [locationValue, setLocationValue] = useState("");

  return (
    <>
      <div className="w-3/5 mx-auto">
        <h2 className="text-3xl font-semibold tracking-tight transition-colors mb-10">
          Where is your Home located?
        </h2>
      </div>

      <form action={createLocation}>
        <input type="hidden" name="homeId" value={id} />
        <input type="hidden" name="countryValue" value={locationValue} />
        <div className="w-3/5 mx-auto mb-36">
          <div className="mb-5">
            <Select
              required
              items={countries}
              onValueChange={(value) => setLocationValue(value as string)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Countries</SelectLabel>
                  {countries.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <LazyMap locationValue={locationValue} />
        </div>

        <CreationBottomBar />
      </form>
    </>
  );
}
