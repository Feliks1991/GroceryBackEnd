import { Router } from "express";
import {
  userRegister,
  tokensRefresh,
  userDelete,
  userUpdate,
  userLogin,
  userLogout,
  getUser,
} from "../controllers/usersController.mjs";
import authGuard from "../utils/authGuard.mjs";
const router = Router();

router.post("/register", userRegister);
router.post("/login", userLogin);
router.post("/refresh", tokensRefresh);
router.get("/user", authGuard, getUser);
router.patch("/edit", authGuard, userUpdate);
router.delete("/delete", authGuard, userDelete);
router.post("/logout", authGuard, userLogout);

export default router;
