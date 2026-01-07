import path from "path";
import fs from "fs/promises";
import {
  readCategory,
  readProductsComments,
  readProductsCategoryRating,
} from "../utils/productsFilesService.mjs";
import { readJSON, writeJSON } from "../utils/RWservice.mjs";
import { generateSKU, addToSKUMap, removeFromSKUMap } from "../utils/skuService.mjs";
import { dbPath, uploadsPath } from "../utils/productPaths.mjs";
import productUploadLimitCalculate from "../utils/productUploadLimitCalculate.mjs";
import imagesUpdateHandler from "../utils/imagesHundler.mjs";
import { parseProduct } from "../zodShemas/productSchema.mjs";
import { queue } from "../utils/queue.mjs";

// Вспомогательные функции

const productDataCombine = (product, rating, comments) => {
  let combinedData;
  if (Array.isArray(product)) {
    combinedData = product.map((p) => ({
      ...p,
      rating: rating[p.SKU],
      comments: comments[p.SKU],
    }));
  } else {
    combinedData = {
      ...product,
      rating: rating[product.SKU],
      comments: comments[product.SKU],
    };
  }
  return combinedData;
};

// Контроллеры

export const getRandomProducts = async (req, res, next) => {
  const { category } = req.params;
  const { productsCategoryData } = await readCategory(category);
  const { productsRatingsData } = await readProductsCategoryRating(category);
  const { productsCommentsData } = await readProductsComments(category);

  let products = structuredClone(productsCategoryData);

  for (let i = products.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [products[i], products[j]] = [products[j], products[i]];
  }

  const combinedData = productDataCombine(
    products.splice(0, 4),
    productsRatingsData,
    productsCommentsData
  );

  res.status(200).json(combinedData);
};

export const getProductsByCategory = async (req, res, next) => {
  const { category } = req.params;
  const { productsCategoryData } = await readCategory(category);
  const { productsRatingsData } = await readProductsCategoryRating(category);
  const { productsCommentsData } = await readProductsComments(category);
  const combinedData = productDataCombine(
    productsCategoryData,
    productsRatingsData,
    productsCommentsData
  );
  res.status(200).json(combinedData);
};

export const getProductBySKU = async (req, res, next) => {
  const { category, sku } = req.params;
  const { productsCategoryData } = await readCategory(category);
  const { productsRatingsData } = await readProductsCategoryRating(category);
  const { productsCommentsData } = await readProductsComments(category);
  const findProductBySKU = productsCategoryData.find((product) => product.SKU === sku);
  const combinedData = productDataCombine(
    findProductBySKU,
    productsRatingsData,
    productsCommentsData
  );
  res.json(combinedData);
};

export const addProduct = async (req, res, next) => {
  const { category } = req.params;
  const { parsed, error } = parseProduct(req.body);

  if (error) {
    return res.status(400).json(error);
  }

  const productData = parsed;
  const inputTitleImg = req.files["TitleImg"]?.[0];
  const inputImages = req.files["imgs"];

  const { productsCategoryPath, productsCategoryData } = await readCategory(category);
  const { productsRatingsPath, productsRatingsData } = await readProductsCategoryRating(category);
  const { productsCommentsPath, productsCommentsData } = await readProductsComments(category);

  const newSKU = await generateSKU();

  const { titleImgUrl, imgsUrls } = await imagesUpdateHandler(
    req,
    inputTitleImg,
    inputImages,
    newSKU
  );

  const newProductData = {
    SKU: newSKU,
    category: productData.category,
    promo: {
      discount: productData.promo.discount,
      percentage: productData.promo.percentage,
    },
    TitleImg: titleImgUrl,
    imgs: imgsUrls,
    name: productData.name,
    price: {
      regular: productData.price.regular,
      discountCard: productData.promo.discount
        ? (productData.price.regular * (100 - productData.promo.percentage)) / 100
        : 0,
    },
    brand: productData.brand,
    origin: productData.origin,
    packing: {
      value: productData.packing.value,
      unit: productData.packing.unit,
    },
    description: productData.description,
  };

  const newProductsCommentsData = [];
  const newProductsRatingsData = {
    average: 0,
    ratingLength: 0,
    rating5Length: 0,
    rating4Length: 0,
    rating3Length: 0,
    rating2Length: 0,
    rating1Length: 0,
  };

  productsCategoryData.push(newProductData);
  productsRatingsData[newSKU] = newProductsRatingsData;
  productsCommentsData[newSKU] = newProductsCommentsData;

  await Promise.all([
    writeJSON(productsCategoryPath, productsCategoryData),
    writeJSON(productsRatingsPath, productsRatingsData),
    writeJSON(productsCommentsPath, productsCommentsData),
    addToSKUMap(newSKU, productData.name, `${category}.json`),
  ]);

  const combinedData = productDataCombine(
    newProductData,
    newProductsRatingsData,
    newProductsCommentsData
  );

  res.json(combinedData);
};

export const deleteProduct = async (req, res, next) => {
  const { category, sku } = req.params;

  const { productsCategoryPath, productsCategoryData } = await readCategory(category);
  const { productsCommentsPath, productsCommentsData } = await readProductsComments(category);
  const { productsRatingsPath, productsRatingsData } = await readProductsCategoryRating(category);
  const imgsDirPath = path.join(uploadsPath, "products", `${category}`, `${sku}`);

  const updatedProducts = productsCategoryData.filter((product) => product.SKU !== sku);

  delete productsCommentsData[sku];
  delete productsRatingsData[sku];

  await Promise.all([
    fs.rm(imgsDirPath, { recursive: true, force: true }),
    writeJSON(productsCategoryPath, updatedProducts),
    writeJSON(productsCommentsPath, productsCommentsData),
    writeJSON(productsRatingsPath, productsRatingsData),
    removeFromSKUMap(sku),
  ]);

  const combinedData = productDataCombine(
    productsCategoryData,
    productsCommentsData,
    productsRatingsData
  );

  res.json(combinedData);
};

export const updateProduct = async (req, res, next) => {
  const { category, sku } = req.params;
  const { parsed, error } = parseProduct(req.body);

  if (error) {
    return res.status(400).json(error);
  }

  const newData = parsed;

  const inputTitleImage = req.files["TitleImg"]?.[0];
  const inputImages = req.files["imgs"];

  const { productsCategoryPath, productsCategoryData } = await readCategory(category);
  const { productsRatingsData } = await readProductsCategoryRating(category);
  const { productsCommentsData } = await readProductsComments(category);

  const updatedProductIndex = productsCategoryData.findIndex((product) => product.SKU === sku);
  let updatedProduct = productsCategoryData[updatedProductIndex];

  const dataUpdateHandler = (newObject, currentObject) => {
    let renewedObject = structuredClone(currentObject);

    function recursiveUpdate(source, target) {
      for (const key in source) {
        if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
          recursiveUpdate(source[key], target[key]);
        } else if (key !== "deletedImgs") {
          target[key] = source[key];
        }
      }
    }
    recursiveUpdate(newObject, renewedObject);

    renewedObject.price.discountCard = renewedObject.promo.discount
      ? (renewedObject.price.regular * (100 - renewedObject.promo.percentage)) / 100
      : renewedObject.price.regular;

    return renewedObject;
  };

  try {
    await productUploadLimitCalculate(req, newData.deletedImgs, inputTitleImage, inputImages);
    updatedProduct = dataUpdateHandler(newData, updatedProduct);
  } catch (error) {
    res.status(401).json({ error: error.message });
    return;
  }

  const { titleImgUrl, imgsUrls } = await imagesUpdateHandler(
    req,
    inputTitleImage,
    inputImages,
    sku,
    newData.deletedImgs,
    updatedProduct
  );

  updatedProduct.TitleImg = titleImgUrl;
  updatedProduct.imgs = imgsUrls;

  productsCategoryData[updatedProductIndex] = updatedProduct;

  await writeJSON(productsCategoryPath, productsCategoryData);
  const combinedData = productDataCombine(
    updatedProduct,
    productsRatingsData,
    productsCommentsData
  );
  res.status(200).json(combinedData);
};

export const likeProductToggle = async (req, res, next) => {
  const { category, sku } = req.params;
  const { user, authorized } = req.auth;

  if (!authorized) {
    throw { status: 403, message: "Not authorized" };
  }

  const userFavoriteDir = path.join(dbPath, "products", "userSelectedProducts", `${user.id}`);
  const userFavoriteFile = path.join(userFavoriteDir, `${user.id}_liked.json`);

  await queue(async () => {
    try {
      await addRemoveToggle(userFavoriteDir, userFavoriteFile, sku, category);
    } catch (error) {
      throw error;
    }
  });
  res.status(200).json({ message: `${sku} was toggle` });
};

export const getLikedProduct = async (req, res, next) => {
  const { user, authorized } = req.auth;

  if (!authorized) {
    throw { status: 403, message: "Not authorized" };
  }

  const userLikedProductsFile = path.join(
    dbPath,
    "products",
    "userSelectedProducts",
    `${user.id}`,
    `${user.id}_liked.json`
  );
  const likedProductsData = await readJSON(userLikedProductsFile);
  return res.status(200).json(likedProductsData);
};
