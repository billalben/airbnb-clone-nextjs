import { MapFilterItems } from "./components/MapFilterItems";

export default function Home({
  searchParams,
}: {
  searchParams?: {
    filter?: string;
    country?: string;
    guest?: string;
    room?: string;
    bathroom?: string;
  };
}) {
  return (
    <div className="container mx-auto px-5 lg:px-10">
      <MapFilterItems />
    </div>
  );
}
