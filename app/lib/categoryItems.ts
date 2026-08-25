import type { LucideIcon } from "lucide-react";
import {
  Umbrella,
  Flame,
  Waves,
  TreePine,
  Crown,
  Mountain,
  Palette,
  Droplets,
  Tent,
  Landmark,
  Trees,
  Sparkles,
  Sailboat,
} from "lucide-react";

interface iAppProps {
  name: string;
  title: string;
  icon: LucideIcon;
  description: string;
  id: number;
}

export const categoryItems: iAppProps[] = [
  {
    id: 0,
    name: "beach",
    description: "This Property is close to the Beach.",
    title: "Beach",
    icon: Umbrella,
  },
  {
    id: 1,
    name: "trending",
    description: "This is a Property which is trending.",
    title: "Trending",
    icon: Flame,
  },
  {
    id: 2,
    name: "beachfront",
    description: "This is a Property is close to the beachfront",
    title: "Beachfront",
    icon: Waves,
  },
  {
    id: 3,
    name: "earthhome",
    description: "This Property is considerd a Earth Home",
    title: "Earth Home",
    icon: TreePine,
  },
  {
    id: 4,
    name: "luxe",
    description: "This Property is considerd Luxorious",
    title: "Luxe",
    icon: Crown,
  },
  {
    id: 5,
    name: "amazingView",
    description: "This property has an amazing View",
    title: "Amazing View",
    icon: Mountain,
  },
  {
    id: 6,
    name: "design",
    description: "This property puts a big focus on design ",
    title: "Design",
    icon: Palette,
  },
  {
    id: 7,
    name: "pool",
    description: "This property has an amazing Pool",
    title: "Pool",
    icon: Droplets,
  },
  {
    id: 8,
    name: "tiny",
    description: "This property is considered a tiny home",
    title: "Tiny Home",
    icon: Tent,
  },
  {
    id: 9,
    name: "historic",
    description: "This Property is considered historic",
    title: "Historic Home",
    icon: Landmark,
  },
  {
    id: 10,
    name: "countryside",
    description: "This Property is located on the countryside",
    title: "Countryside",
    icon: Trees,
  },
  {
    id: 11,
    name: "omg",
    description: "This Property has a wow factor",
    title: "WOW!",
    icon: Sparkles,
  },
  {
    id: 12,
    name: "surfing",
    description: "This Property is located near to a surfing spot",
    title: "Surfing",
    icon: Sailboat,
  },
];
