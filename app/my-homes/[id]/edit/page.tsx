import { notFound } from "next/navigation";
import prisma from "@/app/lib/db";
import { canEditHome } from "@/app/lib/auth";
import { getImageUrls } from "@/app/lib/supabase/storage";
import { EditHomeForm } from "@/app/components/EditHomeForm";
import { HomeImageManager } from "@/app/components/HomeImageManager";
import { DeleteHomeButton } from "@/app/components/DeleteHomeButton";
import { connection } from "next/server";

async function getHome(homeId: string) {
  await connection();
  return prisma.home.findUnique({
    where: { id: homeId },
    include: {
      images: {
        orderBy: { position: "asc" },
      },
    },
  });
}

export default async function EditHomePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const edit = await canEditHome(id);
  if (!edit) notFound();

  const home = await getHome(id);
  if (!home) notFound();

  const imageUrls = await getImageUrls(home.images.map((i) => i.path));
  const images = home.images.map((img, i) => ({
    id: img.id,
    path: img.path,
    url: imageUrls[i] ?? "",
    isPrimary: img.isPrimary,
  }));

  return (
    <div className="container mx-auto mt-10 px-5 lg:px-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Edit home</h1>
        <DeleteHomeButton homeId={home.id} variant="destructive" />
      </div>

      <div className="space-y-10">
        <section>
          <h2 className="mb-4 text-xl font-semibold">Details</h2>
          <EditHomeForm
            home={{
              id: home.id,
              title: home.title,
              description: home.description,
              price: home.price,
              guests: home.guests,
              bedrooms: home.bedrooms,
              bathrooms: home.bathrooms,
              categoryName: home.categoryName,
              country: home.country,
            }}
          />
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">Photos</h2>
          <HomeImageManager homeId={home.id} images={images} />
        </section>
      </div>
    </div>
  );
}
