import * as z from "zod";

export const productSchema = z.object({
  category: z.string(),
  promo: z.object({
    discount: z.stringbool(),
    percentage: z.transform((input) => Number(input)),
  }),
  TitleImg: z.string().optional(),
  imgs: z.array(z.string()).optional(),
  name: z.string().optional(),
  price: z.object({
    regular: z.transform((input) => Number(input)),
    discountCard: z.transform((input) => Number(input)).optional(),
  }),
  brand: z.string().optional(),
  origin: z.string().optional(),
  packing: z.object({
    value: z.transform((input) => Number(input)),
    unit: z.string(),
  }),
  description: z.string().optional(),
  deletedImgs: z.array(z.string()).optional(),
});

export const parseProduct = (productData) => {
  const data = registerSchema.parse(productData);
  return data;
};

// export const ratingSchema = z.object({ rating: z.number().integer().min(1).max(5).required() });

// export const commentSchema = z.array(z.object({ comment: z.string().required() }).unknown(false));
