import path from "path";
import { readJSON } from "./RWservice.mjs";
import { dbPath } from "./productPaths.mjs";
import fs from "fs/promises";

export const readCategory = async (category) => {
  const productsCategoryPath = path.join(dbPath, "products", `${category}`, `${category}.json`);
  const productsCategoryData = await readJSON(productsCategoryPath);
  return { productsCategoryPath, productsCategoryData };
};

export const readProductsComments = async (category) => {
  const productsCommentsPath = path.join(dbPath, "products", `${category}`, `${category}comments.json`);
  const productsCommentsData = await readJSON(productsCommentsPath);
  return { productsCommentsPath, productsCommentsData };
};

export const readProductsCategoryRating = async (category) => {
  const productsRatingsPath = path.join(dbPath, "products", `${category}`, `${category}ratings.json`);
  const productsRatingsData = await readJSON(productsRatingsPath);
  return { productsRatingsPath, productsRatingsData };
};

export const fileExist = async(path) => {
  return await fs.access(path, fs.constants.F_OK).then(()=> true).catch(()=> false)
}
