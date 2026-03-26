import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import noteRoutes from "./routes/note.routes.js";
import adminRoutes from "./routes/admin.routes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth",  authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/admin", adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal server error", error: err.message });
});

db.connect((err) => {
    if (err) console.error("MySQL error:", err);
    else console.log("MySQL connected successfully");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

