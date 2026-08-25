"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { ArrowLeft, Bath, Bed, Globe, Search, Users, X } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getCountryByValue } from "../lib/getCountries";
import { Button } from "@/components/ui/button";
import { CreationSubmit } from "./SubmitButtons";
import { Card, CardHeader } from "@/components/ui/card";
import { Counter } from "./Counter";
import { CountryCombobox } from "./CountryCombobox";

export function SearchModalComponent() {
  const [step, setStep] = useState(1);
  const [locationValue, setLocationValue] = useState("");

  const searchParams = useSearchParams();
  const countryParam = searchParams.get("country");
  const guestParam = searchParams.get("guest");
  const roomParam = searchParams.get("room");
  const bathroomParam = searchParams.get("bathroom");
  const hasFilter = Boolean(
    countryParam || guestParam || roomParam || bathroomParam,
  );
  const country = countryParam ? getCountryByValue(countryParam) : null;

  return (
    <Dialog>
      <DialogTrigger className="group flex cursor-pointer items-center gap-1 rounded-full border border-border/60 bg-background px-2 py-2 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md lg:px-4 lg:py-2">
        <div className="flex h-full items-center divide-x divide-border/60 font-medium">
          <div className="flex items-center gap-1.5 px-4">
            <Globe className="h-4 w-4 text-muted-foreground" />
            {country ? (
              <span className="max-w-32 truncate">
                {country.flag} {country.label}
              </span>
            ) : null}
          </div>
          <div className="hidden items-center gap-1.5 px-4 sm:flex">
            <Users className="h-4 w-4 text-muted-foreground" />
            {guestParam ? <span>{guestParam}</span> : null}
          </div>
          <div className="hidden items-center gap-1.5 px-4 sm:flex">
            <Bed className="h-4 w-4 text-muted-foreground" />
            {roomParam ? <span>{roomParam}</span> : null}
          </div>
          <div className="hidden items-center gap-1.5 px-4 sm:flex">
            <Bath className="h-4 w-4 text-muted-foreground" />
            {bathroomParam ? <span>{bathroomParam}</span> : null}
          </div>
        </div>

        {hasFilter ? (
          <Link
            href="/"
            onClick={(e) => e.stopPropagation()}
            className="ml-1 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Clear all filters"
          >
            <X className="h-4 w-4" />
          </Link>
        ) : null}
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25">
        <form action="/" method="get" className="flex flex-col gap-4">
          <input type="hidden" name="country" value={locationValue} />
          {step === 1 ? (
            <>
              <DialogHeader>
                <DialogTitle>Select a Country</DialogTitle>
                <DialogDescription>
                  Please Choose a Country, so that what you want
                </DialogDescription>
              </DialogHeader>

              <CountryCombobox
                value={locationValue}
                onValueChange={(v) => setLocationValue(v ?? "")}
                placeholder="Select a Country"
              />
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Select all the info you need</DialogTitle>
                <DialogDescription>
                  Please Choose a Country, so that what you want
                </DialogDescription>
              </DialogHeader>

              <Card>
                <CardHeader className="flex flex-col gap-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium underline">Guests</h3>
                      <p className="text-sm text-muted-foreground">
                        How many guests do you want?
                      </p>
                    </div>

                    <Counter name="guest" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <h3 className="font-medium underline">Rooms</h3>
                      <p className="text-sm text-muted-foreground">
                        How many rooms do you have?
                      </p>
                    </div>

                    <Counter name="room" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <h3 className="font-medium underline">Bathrooms</h3>
                      <p className="text-sm text-muted-foreground">
                        How many bathrooms do you have?
                      </p>
                    </div>

                    <Counter name="bathroom" />
                  </div>
                </CardHeader>
              </Card>
            </>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            {step === 2 ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            ) : (
              <span />
            )}
            {step === 1 ? (
              <Button
                onClick={() => setStep(2)}
                type="button"
                size="lg"
                disabled={!locationValue}
              >
                Next
              </Button>
            ) : (
              <CreationSubmit label="Search" icon={Search} />
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
