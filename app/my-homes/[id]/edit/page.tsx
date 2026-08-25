import { notFound } from "next/navigation";
import prisma from "@/app/lib/db";
import { canEditHome } from "@/app/lib/auth";
import { getImageUrls } from "@/app/lib/supabase/storage";
import { HomeFormWizard } from "@/app/components/home-form/HomeFormWizard";
import { HomePhotosEditor } from "@/app/components/home-form/HomePhotosEditor";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { updateHome, updateHomeImages } from "@/app/actions";
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

  const updateAction = updateHome.bind(null, home.id);
  const updateImagesAction = updateHomeImages.bind(null, home.id);

  return (
    <div className="container mt-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Edit home</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Update listing details and manage photos. To delete this home, go to
          My Listings.
        </p>
      </div>

      <Tabs defaultValue="details">
        <TabsList className="w-full">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
        </TabsList>

        <TabsContent value="details" keepMounted className="mt-6">
          <HomeFormWizard
            mode="edit"
            defaultValues={{
              categoryName: home.categoryName,
              title: home.title,
              description: home.description,
              price: home.price,
              guests: home.guests,
              bedrooms: home.bedrooms,
              bathrooms: home.bathrooms,
              country: home.country,
            }}
            action={updateAction}
          />
        </TabsContent>

        <TabsContent value="photos" keepMounted className="my-6">
          <div>
            <HomePhotosEditor
              homeId={home.id}
              initialImages={images}
              action={updateImagesAction}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}