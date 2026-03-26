import express from "express";
import { getAllUsers } from "../controllers/admin.controller.js";
import { verifySuperAdmin } from "../middleware/admin.middleware.js";

const router = express.Router();

// All admin routes require superadmin token
router.get("/users", verifySuperAdmin, getAllUsers);

export default router;
