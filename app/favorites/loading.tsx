import { SkeltonCard } from "../components/SkeletonCard";

export default function FavoritesLoading() {
  return (
    <section className="container mx-auto mt-10 px-5 lg:px-10">
      <h2 className="text-3xl font-semibold tracking-tight">Your Favorites</h2>

      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeltonCard key={index} />
        ))}
      </div>
    </section>
  );
}
