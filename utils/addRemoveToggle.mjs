import { readCategory, fileExist } from "../utils/productsFilesService.mjs";
import { readJSON, writeJSON } from "../utils/RWservice.mjs";
import fs from "fs/promises";

export const addRemoveToggle = async (dirPath, filePath, sku, setedItem) => {
  if (!(await fileExist(filePath))) {
    await fs.mkdir(dirPath, { recursive: true });
    await writeJSON(filePath, []);
  }

  const cartFileData = await readJSON(filePath);
  const elementPresence = cartFileData.findIndex((element) => element.SKU === sku);

  if (elementPresence === -1) {
    cartFileData.push(setedItem);
  } else {
    cartFileData.splice(elementPresence, 1);
  }
  await writeJSON(filePath, cartFileData);
};
