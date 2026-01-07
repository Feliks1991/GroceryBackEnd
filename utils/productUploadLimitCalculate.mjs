import fs from "fs/promises";
import path from "path";
import { uploadsPath } from "./productPaths.mjs";

export const productUploadLimit = {
  TitleImg: 1,
  imgs: 5,
  get limit() {
    return this.TitleImg + this.imgs;
  },
};

const productUploadLimitCalculate = async (req, deletedImgs, addedTitleImg, addedImgs) => {
  const imgDirPath = path.join(
    uploadsPath,
    "products",
    `${req.params.category}`,
    `${req.params.sku}`
  );

  const imgsDir = await fs.readdir(imgDirPath);
  const currentImgsCount = imgsDir.length;
  const titleImgCount = Number(!!addedTitleImg);
  const imgsCount = addedImgs?.length || 0;
  const deletedImgsCount = deletedImgs?.length || 0;

  const imgsQuantity = currentImgsCount - deletedImgsCount + titleImgCount + imgsCount;

  const acceptedImagesQty = deletedImgsCount + productUploadLimit.limit - currentImgsCount;

  if (imgsQuantity > productUploadLimit.limit) {
    throw new Error(
      `You can't upload more than ${acceptedImagesQty} ${
        acceptedImagesQty === 1 ? "image" : "images"
      }`
    );
  }
  return;
};

export default productUploadLimitCalculate;
