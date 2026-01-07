import { Router } from "express";
import {
  addComment,
  deleteComment,
  getComments,
  updateComment,
} from "../controllers/commentController.mjs";
import authGuard from "../utils/authGuard.mjs";

const router = Router();
router.get("/:category/:sku", getComments);
router.post("/:category/:sku", authGuard, addComment);
router.delete("/:category/:id", authGuard, deleteComment);
router.patch("/:category/:id", authGuard, updateComment);

export default router;
