import { readJSON, writeJSON } from "./RWservice.mjs";
import {SKUMapPath} from "./productPaths.mjs";

const readSKUMap = async () => {
  const SKUMapData = await readJSON(SKUMapPath);
  return { SKUMapPath, SKUMapData };
};

export const generateSKU = async () => {
  const SKUMapData = await readJSON(SKUMapPath);
  const existingSKUs = new Set(Object.keys(SKUMapData));
  let generatedSKU;
  do {
    generatedSKU = Math.floor(100000 + Math.random() * 900000);
  } while (existingSKUs.has(generatedSKU));
  return generatedSKU.toString();
};

export const addToSKUMap = async (sku, name, source) => {
  const { SKUMapPath, SKUMapData } = await readSKUMap();
  SKUMapData[sku] = { name, source };
  writeJSON(SKUMapPath, SKUMapData);
};

export const removeFromSKUMap = async (sku) => {
  const { SKUMapPath, SKUMapData } = await readSKUMap();
  if (SKUMapData[sku]) {
    delete SKUMapData[sku];
  }
  writeJSON(SKUMapPath, SKUMapData);
};
