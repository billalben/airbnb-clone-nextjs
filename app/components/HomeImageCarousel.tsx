"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export type HomeImage = {
  id: string;
  url: string | null;
  isPrimary: boolean;
};

function CarouselDots({ count }: { count: number }) {
  const { api } = useCarousel();
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = (a: NonNullable<CarouselApi>) =>
      setSelected(a.selectedScrollSnap());
    onSelect(api);
    api.on("reInit", onSelect);
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const goTo = useCallback(
    (i: number) => {
      api?.scrollTo(i);
    },
    [api],
  );

  if (count <= 1) return null;

  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 rounded-full bg-background/80 px-2.5 py-1.5 shadow-sm backdrop-blur">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Go to image ${i + 1}`}
          onClick={() => goTo(i)}
          className={cn(
            "h-2 w-2 rounded-full transition-all",
            i === selected
              ? "w-4 bg-foreground"
              : "bg-foreground/30 hover:bg-foreground/60",
          )}
        />
      ))}
    </div>
  );
}

export function HomeImageCarousel({ images }: { images: HomeImage[] }) {
  const valid = images.filter((i): i is HomeImage & { url: string } =>
    Boolean(i.url),
  );

  if (valid.length === 0) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted md:aspect-[16/9]" />
    );
  }

  if (valid.length === 1) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted md:aspect-[16/9]">
        <Image
          src={valid[0].url}
          alt="Image of Home"
          fill
          sizes="(min-width: 1024px) 80vw, 100vw"
          className="object-cover"
          priority
        />
      </div>
    );
  }

  return (
    <Carousel
      opts={{ loop: true, align: "start" }}
      className="relative w-full"
    >
      <CarouselContent>
        {valid.map((img) => (
          <CarouselItem key={img.id} className="basis-full">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted md:aspect-[16/9]">
              <Image
                src={img.url}
                alt="Image of Home"
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover"
                priority={img.isPrimary}
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-3 z-20 bg-background/80 hover:bg-background border-transparent shadow-sm disabled:opacity-0" />
      <CarouselNext className="right-3 z-20 bg-background/80 hover:bg-background border-transparent shadow-sm disabled:opacity-0" />
      <CarouselDots count={valid.length} />
    </Carousel>
  );
}
