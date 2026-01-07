import { Router } from "express";
import {
  getProductsByCategory,
  getProductBySKU,
  addProduct,
  deleteProduct,
  getRandomProducts,
  updateProduct,
  likeProductToggle,
  getLikedProduct,
} from "../controllers/productController.mjs";
import { upload } from "../middlewares/multer.mjs";
import { productUploadLimit } from "../utils/productUploadLimitCalculate.mjs";
import authGuard from "../utils/authGuard.mjs";

const router = Router();

router.get("/favorites", authGuard, getLikedProduct);
router.get("/:category", getProductsByCategory);
router.get("/random/:category", getRandomProducts);
router.get("/:category/:sku", getProductBySKU);
router.post(
  "/:category",
  upload.fields([
    { name: "TitleImg", maxCount: 1 },
    { name: "imgs", maxCount: 5 },
  ]),
  addProduct
);

router.delete("/:category/:sku", deleteProduct);

router.patch(
  "/:category/:sku",
  upload.fields([
    { name: "TitleImg", maxCount: productUploadLimit.TitleImg },
    { name: "imgs", maxCount: productUploadLimit.imgs },
  ]),
  updateProduct
);

router.post ("/favorites/:category/:sku", authGuard, likeProductToggle);


export default router;
