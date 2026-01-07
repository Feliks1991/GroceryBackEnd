import fs from "fs/promises";
import path from "path";
import { readJSON, writeJSON } from "./RWservice.mjs";
import { dbPath } from "./productPaths.mjs";

export const promotionFilter = async () => {
  const productionJSONFilesPath = path.join(dbPath, "products", "toproduction");

  const productionJSONFiles = await fs.readdir(productionJSONFilesPath);

  let promo = [];
  let promoratings = {};
  let promocomments = {};

  for (const element of productionJSONFiles) {
    const fileData = await readJSON(path.join(productionJSONFilesPath, element));
    fileData.forEach((element) => {
      if (element.promo.discount === true) {
        promoratings[element.SKU] = element.rating;
        promocomments[element.SKU] = element.comments;
        element.SKU = String(element.SKU);
        element.TitleImg = "http://localhost:5000/placeholders/1.webp";
        element.imgs = [
          "http://localhost:5000/placeholders/2.webp",
          "http://localhost:5000/placeholders/3.webp",
          "http://localhost:5000/placeholders/4.webp",
          "http://localhost:5000/placeholders/5.webp",
          "http://localhost:5000/placeholders/6.webp",
        ];
        delete element.rating;
        delete element.comments;
        promo.push(element);
      }
    });
  }

  const promotionsFolderPath = path.join(dbPath, "products", "promotions");

  await fs.mkdir(promotionsFolderPath, { recursive: true });

  await writeJSON(path.join(promotionsFolderPath, "promotions.json"), promo);
  await writeJSON(path.join(promotionsFolderPath, "promotionscomments.json"), promocomments);
  await writeJSON(path.join(promotionsFolderPath, "promotionsratings.json"), promoratings);
};
