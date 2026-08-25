import * as z from "zod";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const MAX_IMAGES_PER_HOME = 4;

export const COUNTER_MIN = 1;
export const COUNTER_MAX = 10;

const imageSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0, "Please choose an image.")
  .refine((file) => file.size <= MAX_IMAGE_BYTES, "Image must be 5MB or smaller.")
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    "Image must be JPEG, PNG, or WEBP.",
  )
  .optional();

const baseShape = {
  categoryName: z.string().min(1, "Pick a category."),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters.")
    .max(50, "Title must be 50 characters or fewer."),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters.")
    .max(2000, "Description must be 2000 characters or fewer."),
  price: z.coerce
    .number({ message: "Price must be a number." })
    .int("Price must be a whole number.")
    .min(10, "Price must be at least $10."),
  image: imageSchema,
  guests: z.coerce.number().int().min(COUNTER_MIN).max(COUNTER_MAX),
  bedrooms: z.coerce.number().int().min(COUNTER_MIN).max(COUNTER_MAX),
  bathrooms: z.coerce.number().int().min(COUNTER_MIN).max(COUNTER_MAX),
  country: z.string().min(1, "Pick a country."),
};

export const homeFormSchema = z
  .object(baseShape)
  .refine((data) => data.image !== undefined, {
    message: "Please choose an image.",
    path: ["image"],
  });

export const homeEditFormSchema = z.object(baseShape);

export type HomeFormValues = z.infer<typeof homeEditFormSchema>;

export const newImageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0, "Please choose an image.")
  .refine((file) => file.size <= MAX_IMAGE_BYTES, "Image must be 5MB or smaller.")
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    "Image must be JPEG, PNG, or WEBP.",
  );

export const MAX_NEW_IMAGES_PER_SAVE = 10;

export const stepFields = {
  category: ["categoryName"] as const,
  image: ["image"] as const,
  details: [
    "title",
    "description",
    "price",
    "guests",
    "bedrooms",
    "bathrooms",
  ] as const,
  location: ["country"] as const,
};