import express from "express";
import { register, login, logout, getUserByEmail } from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login",    login);
router.post("/logout",   verifyToken, logout);   // clears last_active_at
router.get("/user-by-email", verifyToken, getUserByEmail);

export default router;
