import { CreateDescription } from "@/app/actions";
import { Counter } from "@/app/components/Counter";
import { CreationBottomBar } from "@/app/components/CreationBottomBar";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function DescriptionPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <>
      <div className="mx-auto w-3/5">
        <h2 className="text-xl font-semibold tracking-tight transition-colors lg:text-3xl">
          Please describe your home as good as you can!
        </h2>
      </div>

      <form action={CreateDescription}>
        <input type="hidden" name="homeId" value={params.id} />
        <div className="mx-auto mb-36 mt-10 flex w-3/5 flex-col gap-y-5">
          <div className="flex flex-col gap-y-2">
            <Label>Title</Label>
            <Input
              name="title"
              type="text"
              required
              minLength={3}
              maxLength={50}
              placeholder="Short and simple..."
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Label>Description</Label>
            <Textarea
              name="description"
              required
              minLength={10}
              placeholder="Please describe your home..."
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label>Price</Label>
            <Input
              name="price"
              type="number"
              required
              placeholder="Price per Night in USD"
              min={10}
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label>Image</Label>
            <Input name="image" type="file" required />
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

                <Counter name="guest" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-y-2">
                <div>
                  <h3 className="font-medium underline">Rooms</h3>
                  <p className="text-sm text-muted-foreground">
                    How many rooms do you have?
                  </p>
                </div>

                <Counter name="room" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-y-2">
                <div>
                  <h3 className="font-medium underline">Bathrooms</h3>
                  <p className="text-sm text-muted-foreground">
                    How many bathrooms do you have?
                  </p>
                </div>

                <Counter name="bathroom" />
              </div>
            </CardHeader>
          </Card>
        </div>

        <CreationBottomBar />
      </form>
    </>
  );
}
