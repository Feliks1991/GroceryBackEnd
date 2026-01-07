import * as z from "zod";

const phoneSchema = z.preprocess((val) => {
  if (typeof val !== "string") {
    return val;
  }

  let cleaned = val.replace(/[^\d+]/g, "");

  if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }

  return cleaned;
}, z.string());

export const registerSchema = z.object({
  name: z.string().min(2),
  lastname: z.string(),
  sex: z.string(),
  birthday: z.string(),
  password: z.string().min(8),
  country: z.string(),
  city: z.string(),
  phone: phoneSchema,
  email: z.email(),
});

export const updateShema = z.object({
  name: z.string().min(2),
  lastname: z.string(),
  sex: z.string(),
  birthday: z.string(),
  country: z.string(),
  city: z.string(),
  phone: phoneSchema,
  email: z.email(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.number(),
});

export const registerDataParse = (registerInputData) => {
  const data = registerSchema.parse(registerInputData);
  return data;
};

export const updateDataParse = (updateInputData) => {
  const data = updateShema.parse(updateInputData);
  return data;
};
