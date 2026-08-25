import { requireAdmin } from "@/app/lib/auth";
import prisma from "@/app/lib/db";
import { getImageUrls } from "@/app/lib/supabase/storage";
import { AdminDeleteHomeButton } from "@/app/components/admin/AdminDeleteHomeButton";
import { AdminImageRow } from "@/app/components/admin/AdminImageRow";
import { getCountryByValue } from "@/app/lib/getCountries";
import { unstable_noStore as noStore } from "next/cache";

export default async function AdminHomes() {
  await requireAdmin();
  noStore();

  const homes = await prisma.home.findMany({
    orderBy: { createdAT: "desc" },
    include: {
      User: { select: { firstName: true, lastName: true, email: true } },
      images: {
        orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
      },
    },
  });

  const allPaths = homes.flatMap((h) => h.images.map((i) => i.path));
  const urls = await getImageUrls(allPaths);
  let urlCursor = 0;
  const urlFor = () => urls[urlCursor++] ?? null;

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50 text-left">
          <tr>
            <th className="px-3 py-2 font-medium">Home</th>
            <th className="px-3 py-2 font-medium">Owner</th>
            <th className="px-3 py-2 font-medium">Category</th>
            <th className="px-3 py-2 font-medium">Country</th>
            <th className="px-3 py-2 font-medium">Price</th>
            <th className="px-3 py-2 font-medium">Images</th>
            <th className="px-3 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {homes.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                No homes yet.
              </td>
            </tr>
          ) : (
            homes.map((home) => {
              const country = getCountryByValue(home.country ?? "");
              return (
                <tr key={home.id} className="border-b align-top">
                  <td className="px-3 py-2">
                    <div className="font-medium">{home.title ?? "(untitled)"}</div>
                    <div className="text-xs text-muted-foreground">{home.id}</div>
                  </td>
                  <td className="px-3 py-2">
                    {home.User
                      ? `${home.User.firstName} ${home.User.lastName}`
                      : "—"}
                    {home.User?.email && (
                      <div className="text-xs text-muted-foreground">
                        {home.User.email}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">{home.categoryName ?? "—"}</td>
                  <td className="px-3 py-2">
                    {country ? `${country.flag} ${country.label}` : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {home.price ? `$${home.price}` : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-2">
                      {home.images.length === 0 ? (
                        <span className="text-xs text-muted-foreground">none</span>
                      ) : (
                        home.images.map((img) => (
                          <AdminImageRow
                            key={img.id}
                            homeId={home.id}
                            imageId={img.id}
                            isPrimary={img.isPrimary}
                            url={urlFor() ?? ""}
                          />
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <AdminDeleteHomeButton homeId={home.id} />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
