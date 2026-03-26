import express from "express";
import {
    createNote,
    getNotesByUser,
    getNoteById,
    updateNote,
    deleteNote,
    getNoteByShareId,
    shareNote,
    getSharedWithMe,
    getPublicNotes,
    getSharedUsers,
    revokeShare
} from "../controllers/note.controller.js";
import { verifyToken, verifyTokenOptional } from "../middleware/auth.middleware.js";

const router = express.Router();

// Protected routes (require authentication)
router.post("/create", verifyToken, createNote);
router.get("/my-notes", verifyToken, getNotesByUser);
router.get("/shared-with-me", verifyToken, getSharedWithMe);
router.put("/update/:id", verifyToken, updateNote);
router.post("/share/:noteId", verifyToken, shareNote);
router.get("/share-list/:noteId", verifyToken, getSharedUsers);       // who has access
router.delete("/share/:noteId/:targetUserId", verifyToken, revokeShare); // revoke access
router.delete("/:id", verifyToken, deleteNote);

// Semi-protected route (optional token)
router.get("/public/all", getPublicNotes);

// Public routes (no authentication required)
router.get("/share/:shareId", verifyTokenOptional, getNoteByShareId);

// Generic routes (wildcard - must be last)
router.get("/:id", verifyToken, getNoteById);

export default router;
