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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Search } from "lucide-react";
import { useState } from "react";
import { useCountries } from "../lib/getCountries";
import { Button } from "@/components/ui/button";
import { CreationSubmit } from "./SubmitButtons";
import { Card, CardHeader } from "@/components/ui/card";
import { Counter } from "./Counter";

export function SearchModalComponent() {
  const [step, setStep] = useState(1);
  const [locationValue, setLocationValue] = useState("");
  const { getAllCountries } = useCountries();

  function SubmitButtonLocal() {
    if (step === 1) {
      return (
        <Button onClick={() => setStep((prev) => prev + 1)} type="button">
          Next
        </Button>
      );
    } else if (step === 2) {
      return <CreationSubmit />;
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex cursor-pointer items-center rounded-full border px-5 py-2">
          <div className="flex h-full divide-x font-medium">
            <p className="hidden px-4 sm:block">Anywhere</p>
            <p className="hidden px-4 sm:block">Any Week</p>
            <p className="hidden px-4 sm:block">Add Guests</p>
          </div>

          <Search className="h-8 w-8 rounded-full bg-primary p-2 text-white" />
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form className="flex flex-col gap-4">
          <input type="hidden" name="country" value={locationValue} />
          {step === 1 ? (
            <>
              <DialogHeader>
                <DialogTitle>Select a Country</DialogTitle>
                <DialogDescription>
                  Please Choose a Country, so that what you want
                </DialogDescription>
              </DialogHeader>

              <Select
                required
                onValueChange={(value) => setLocationValue(value)}
                value={locationValue}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Countries</SelectLabel>
                    {getAllCountries().map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.flag} {item.label} / {item.region}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
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

          <DialogFooter>
            <SubmitButtonLocal />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
