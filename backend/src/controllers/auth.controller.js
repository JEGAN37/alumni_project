import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";

export const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        db.query(
            "SELECT id FROM users WHERE email = ?",
            [email],
            async (err, data) => {
                if (err) return res.status(500).json({ message: "Database error", error: err });
                if (data.length > 0) {
                    return res.status(400).json({ message: "User already exists" });
                }

                const hashedPassword = await bcrypt.hash(password, 10);

                db.query(
                    "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
                    [email, hashedPassword, name || email.split("@")[0]],
                    (err, result) => {
                        if (err) {
                            return res.status(500).json({ message: "Error registering user", error: err });
                        }
                        res.status(201).json({
                            message: "User registered successfully",
                            userId: result.insertId
                        });
                    }
                );
            }
        );
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

export const login = (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // ── Superadmin hard-coded check ──
        const saEmail = process.env.SUPERADMIN_EMAIL;
        const saPass  = process.env.SUPERADMIN_PASSWORD;

        if (email === saEmail && password === saPass) {
            const token = jwt.sign(
                { id: "superadmin", role: "superadmin" },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );
            return res.json({
                message: "Superadmin login successful",
                token,
                userId: "superadmin",
                email: saEmail,
                role: "superadmin"
            });
        }

        // ── Regular user login ──
        db.query(
            "SELECT id, email, password FROM users WHERE email = ?",
            [email],
            async (err, data) => {
                if (err) return res.status(500).json({ message: "Database error", error: err });
                if (data.length === 0) {
                    return res.status(404).json({ message: "User not found" });
                }

                const isValid = await bcrypt.compare(password, data[0].password);
                if (!isValid) {
                    return res.status(401).json({ message: "Invalid credentials" });
                }

                // Update last_active_at
                db.query("UPDATE users SET last_active_at = NOW() WHERE id = ?", [data[0].id]);

                const token = jwt.sign(
                    { id: data[0].id, role: "user" },
                    process.env.JWT_SECRET,
                    { expiresIn: "7d" }
                );

                res.json({
                    message: "Login successful",
                    token,
                    userId: data[0].id,
                    email: data[0].email,
                    role: "user"
                });
            }
        );
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Look up a user's ID by email (used for share-by-email feature)
export const getUserByEmail = (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    db.query(
        "SELECT id, email, name FROM users WHERE email = ?",
        [email],
        (err, data) => {
            if (err) return res.status(500).json({ message: "Database error", error: err });
            if (data.length === 0) {
                return res.status(404).json({ message: "No user found with that email" });
            }
            res.json({ id: data[0].id, email: data[0].email, name: data[0].name });
        }
    );
};

// Logout — stamp last_logout_at so we know the session ended
export const logout = (req, res) => {
    const userId = req.userId;
    if (!userId) return res.status(400).json({ message: 'No user to log out' });

    db.query(
        'UPDATE users SET last_logout_at = NOW() WHERE id = ?',
        [userId],
        (err) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            res.json({ message: 'Logged out successfully' });
        }
    );
};

