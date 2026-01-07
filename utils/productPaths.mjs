import __dirname from "../rootDir.mjs";
import path from "path";

export const dbPath = path.join(__dirname, "db");
export const uploadsPath = path.join(__dirname, "uploads");
export const SKUMapPath = path.join(dbPath, "sku-map.json");
export const promotionPath = path.join(dbPath, "promotions.json");
export const catalogCards = path.join(dbPath, "catalogCards.json");
