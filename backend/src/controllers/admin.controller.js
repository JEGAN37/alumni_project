import { db } from "../config/db.js";

// GET /api/admin/users
export const getAllUsers = (req, res) => {
    db.query(
        `SELECT
            id,
            name,
            email,
            created_at,
            last_active_at,
            last_logout_at
         FROM users
         ORDER BY created_at DESC`,
        (err, data) => {
            if (err) return res.status(500).json({ message: "Database error", error: err });
            res.json(data);
        }
    );
};
