import path from "path";
import sharp from "sharp";
import { uploadsPath } from "./productPaths.mjs";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";

const createImgAndUrl = async (req, inputBuffer, sku) => {
  const compressedImg = await sharp(inputBuffer)
    .resize(550)
    .rotate()
    .webp({ quality: 80, withoutEnlargement: true })
    .toBuffer();
  const imgsDirPath = path.join(uploadsPath, "products", `${req.params.category}`, `${sku}`);
  const imageName = `compressed-${uuidv4()}-${sku}.webp`;
  const newFilePath = path.join(imgsDirPath, imageName);
  await fs.mkdir(imgsDirPath, { recursive: true });
  await fs.writeFile(newFilePath, compressedImg, { flag: "wx" });
  const imgUrl = `${req.protocol}://${req.get("host")}/products/${
    req.params.category
  }/${sku}/${imageName}`;
  return imgUrl;
};

const imagesHundler = async (req, inputTitleImage, inputImages, sku) => {
  let compressedTitleImgUrl = null;
  let compressedImgsUrls = [];

  if (inputImages) {
    compressedImgsUrls = await Promise.all(
      inputImages.map((img) => createImgAndUrl(req, img.buffer, sku))
    );
  }

  if (inputTitleImage) {
    compressedTitleImgUrl = await createImgAndUrl(req, inputTitleImage.buffer, sku);
  }
  return { compressedTitleImgUrl, compressedImgsUrls };
};

const imagesUpdateHandler = async (
  req,
  inputTitleImage,
  inputImages,
  sku,
  deletedImgs = null,
  updatedProduct = null
) => {
  const titleImgUrlPlaceholder = "http://localhost:3000/placeholders/1.webp";
  const imgsUrlsPlaceholders = [
    "http://localhost:3000/placeholders/2.webp",
    "http://localhost:3000/placeholders/3.webp",
    "http://localhost:3000/placeholders/4.webp",
    "http://localhost:3000/placeholders/5.webp",
    "http://localhost:3000/placeholders/6.webp",
  ];

  const imgDirPath = path.join(uploadsPath, "products", `${req.params.category}`, `${sku}`);
  await fs.mkdir(imgDirPath, { recursive: true });

  const imgFiles = await fs.readdir(imgDirPath);
  const { compressedTitleImgUrl, compressedImgsUrls } = await imagesHundler(
    req,
    inputTitleImage,
    inputImages,
    sku
  );

  let titleImgUrl =
    updatedProduct && !deletedImgs?.includes(path.posix.basename(updatedProduct.TitleImg))
      ? updatedProduct.TitleImg
      : compressedTitleImgUrl;
  let imgsUrls = updatedProduct
    ? [...updatedProduct.imgs, ...compressedImgsUrls].filter(
        (url) => !deletedImgs?.includes(path.posix.basename(url))
      )
    : compressedImgsUrls;
  if (deletedImgs) {
    for (const img of imgFiles) {
      if (deletedImgs.includes(img)) {
        await fs.rm(path.join(imgDirPath, img));
      }
    }
  }

  if (!titleImgUrl && imgsUrls.length === 0) {
    titleImgUrl = titleImgUrlPlaceholder;
    imgsUrls = imgsUrlsPlaceholders;
  } else if (!titleImgUrl && imgsUrls.length > 0) {
    titleImgUrl = imgsUrls.shift();
  }

  return { titleImgUrl, imgsUrls };
};

export default imagesUpdateHandler;
