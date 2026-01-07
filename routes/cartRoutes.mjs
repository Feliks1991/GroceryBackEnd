import { Router } from "express";
import {
  cartToggle,
  getCart,
  quantityChange,
  checked,
  itemsDelete,
  update
} from "../controllers/cartControllers.mjs";
import authGuard from "../utils/authGuard.mjs";

const router = Router();

router.post("/:category/:sku", authGuard, cartToggle);
router.get("/", authGuard, getCart);
router.patch("/check", authGuard, checked);
router.patch("/quantity", authGuard, quantityChange);
router.patch("/update", authGuard, update);
router.delete("/delete", authGuard, itemsDelete);

export default router;
