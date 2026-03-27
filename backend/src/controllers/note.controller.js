import { db } from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

export const createNote = (req, res) => {
    const { title, content, isPublic } = req.body;
    const ownerId = req.userId;
    const shareId = uuidv4();

    db.query(
        "INSERT INTO notes (title, content, owner_id, share_id, is_public) VALUES (?, ?, ?, ?, ?)",
        [title, content, ownerId, shareId, isPublic || false],
        (err, result) => {
            if (err) return res.status(500).json({ message: "Error creating note", error: err });
            res.json({ noteId: result.insertId, shareId, message: "Note created successfully" });
        }
    );
};

export const getNotesByUser = (req, res) => {
    const ownerId = req.userId;

    db.query(
        `SELECT n.*, u.name AS author_name, u.email AS author_email
         FROM notes n
         INNER JOIN users u ON n.owner_id = u.id
         WHERE n.owner_id = ?
         ORDER BY n.updated_at DESC`,
        [ownerId],
        (err, data) => {
            if (err) return res.status(500).json({ message: "Error fetching notes", error: err });
            res.json(data);
        }
    );
};

export const getNoteById = (req, res) => {
    const { id } = req.params;
    const userId = req.userId || null;

    db.query(
        "SELECT * FROM notes WHERE id = ?",
        [id],
        (err, data) => {
            if (err) return res.status(500).json({ message: "Error fetching note", error: err });
            if (data.length === 0) return res.status(404).json({ message: "Note not found" });

            const note = data[0];

            // Check permissions
            if (note.owner_id !== userId && !note.is_public) {
                return res.status(403).json({ message: "Access denied" });
            }

            res.json(note);
        }
    );
};

export const updateNote = (req, res) => {
    const { title, content, isPublic } = req.body;
    const id = req.params.id;
    const userId = req.userId;

    // First verify ownership
    db.query(
        "SELECT owner_id FROM notes WHERE id = ?",
        [id],
        (err, data) => {
            if (err) return res.status(500).json({ message: "Error updating note", error: err });
            if (data.length === 0) return res.status(404).json({ message: "Note not found" });
            if (data[0].owner_id !== userId) return res.status(403).json({ message: "Access denied" });

            db.query(
                "UPDATE notes SET title = ?, content = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                [title, content, isPublic || false, id],
                (err) => {
                    if (err) return res.status(500).json({ message: "Error updating note", error: err });
                    res.json({ message: "Note saved successfully" });
                }
            );
        }
    );
};

export const deleteNote = (req, res) => {
    const { id } = req.params;
    const userId = req.userId;

    // First verify ownership
    db.query(
        "SELECT owner_id FROM notes WHERE id = ?",
        [id],
        (err, data) => {
            if (err) return res.status(500).json({ message: "Error deleting note", error: err });
            if (data.length === 0) return res.status(404).json({ message: "Note not found" });
            if (data[0].owner_id !== userId) return res.status(403).json({ message: "Access denied" });

            db.query(
                "DELETE FROM notes WHERE id = ?",
                [id],
                (err) => {
                    if (err) return res.status(500).json({ message: "Error deleting note", error: err });
                    res.json({ message: "Note deleted successfully" });
                }
            );
        }
    );
};

export const getNoteByShareId = (req, res) => {
    const { shareId } = req.params;
    const userId = req.userId || null;

    // Fetch the note plus author info
    db.query(
        `SELECT n.*, u.name AS author_name, u.email AS author_email
         FROM notes n
         INNER JOIN users u ON n.owner_id = u.id
         WHERE n.share_id = ?`,
        [shareId],
        (err, data) => {
            if (err) return res.status(500).json({ message: "Error fetching note", error: err });
            if (data.length === 0) return res.status(404).json({ message: "Note not found" });

            const note = data[0];

            // Public notes: accessible to all
            if (note.is_public) return res.json(note);

            // Owner always has access
            if (note.owner_id === userId) return res.json(note);

            // Private note: check if this user was explicitly granted access
            if (!userId) {
                return res.status(403).json({ message: "This note is private. Please log in to view it." });
            }

            db.query(
                "SELECT id FROM note_shares WHERE note_id = ? AND shared_with_user_id = ?",
                [note.id, userId],
                (err2, shareRows) => {
                    if (err2) return res.status(500).json({ message: "Error checking share permissions", error: err2 });
                    if (shareRows.length === 0) {
                        return res.status(403).json({ message: "Access denied. This note has not been shared with you." });
                    }
                    res.json(note);
                }
            );
        }
    );
};

export const shareNote = (req, res) => {
    const { sharedWith, isPublic } = req.body;
    const noteId = req.params.noteId;
    const userId = req.userId;

    // Verify ownership first
    db.query(
        "SELECT owner_id FROM notes WHERE id = ?",
        [noteId],
        (err, data) => {
            if (err) return res.status(500).json({ message: "Error sharing note", error: err });
            if (data.length === 0) return res.status(404).json({ message: "Note not found" });
            if (data[0].owner_id !== userId) return res.status(403).json({ message: "Access denied" });

            if (isPublic) {
                db.query(
                    "UPDATE notes SET is_public = 1 WHERE id = ?",
                    [noteId],
                    (err) => {
                        if (err) return res.status(500).json({ message: "Error sharing note", error: err });
                        // return canonical share link
                        db.query("SELECT share_id FROM notes WHERE id = ?", [noteId], (err2, rows) => {
                            if (err2) return res.status(500).json({ message: "Error fetching share id", error: err2 });
                            const shareId = rows[0].share_id;
                            const base = process.env.PUBLIC_URL || 'http://localhost:5173';
                            const shareLink = `${String(base).replace(/\/$/, '')}/share/${shareId}`;
                            res.json({ message: "Note shared publicly", shareId, shareLink });
                        });
                    }
                );
            } else if (sharedWith) {
                // Prevent sharing with yourself
                if (parseInt(sharedWith) === userId) {
                    return res.status(400).json({ message: "You cannot share a note with yourself" });
                }
                // INSERT IGNORE prevents duplicate share errors
                db.query(
                    "INSERT IGNORE INTO note_shares (note_id, shared_with_user_id) VALUES (?, ?)",
                    [noteId, sharedWith],
                    (err, result) => {
                        if (err) return res.status(500).json({ message: "Error sharing note", error: err });
                        if (result.affectedRows === 0) {
                            return res.json({ message: "Note was already shared with this user" });
                        }
                        // return canonical share link too
                        db.query("SELECT share_id FROM notes WHERE id = ?", [noteId], (err2, rows) => {
                            if (err2) return res.status(500).json({ message: "Error fetching share id", error: err2 });
                            const shareId = rows[0].share_id;
                            const base = process.env.PUBLIC_URL || 'http://localhost:5173';
                            const shareLink = `${String(base).replace(/\/$/, '')}/share/${shareId}`;
                            res.json({ message: "Note shared with user", shareId, shareLink });
                        });
                    }
                );
            } else {
                res.status(400).json({ message: "Specify sharedWith user or isPublic flag" });
            }
        }
    );
};

export const getSharedWithMe = (req, res) => {
    const userId = req.userId;

    db.query(
        `SELECT n.*, u.name AS author_name, u.email AS author_email
         FROM notes n
         INNER JOIN note_shares ns ON n.id = ns.note_id
         INNER JOIN users u ON n.owner_id = u.id
         WHERE ns.shared_with_user_id = ?
         ORDER BY n.updated_at DESC`,
        [userId],
        (err, data) => {
            if (err) return res.status(500).json({ message: "Error fetching shared notes", error: err });
            res.json(data);
        }
    );
};

export const getPublicNotes = (req, res) => {
    db.query(
        `SELECT n.*, u.name AS author_name, u.email AS author_email
         FROM notes n
         INNER JOIN users u ON n.owner_id = u.id
         WHERE n.is_public = 1
         ORDER BY n.updated_at DESC
         LIMIT 50`,
        [],
        (err, data) => {
            if (err) return res.status(500).json({ message: "Error fetching public notes", error: err });
            res.json(data);
        }
    );
};

// List who you've shared a note with (owner only)
export const getSharedUsers = (req, res) => {
    const { noteId } = req.params;
    const userId = req.userId;

    db.query(
        "SELECT owner_id FROM notes WHERE id = ?",
        [noteId],
        (err, data) => {
            if (err) return res.status(500).json({ message: "Database error", error: err });
            if (data.length === 0) return res.status(404).json({ message: "Note not found" });
            if (data[0].owner_id !== userId) return res.status(403).json({ message: "Access denied" });

            db.query(
                `SELECT u.id, u.name, u.email, ns.created_at AS shared_at
                 FROM note_shares ns
                 INNER JOIN users u ON ns.shared_with_user_id = u.id
                 WHERE ns.note_id = ?
                 ORDER BY ns.created_at DESC`,
                [noteId],
                (err2, rows) => {
                    if (err2) return res.status(500).json({ message: "Database error", error: err2 });
                    res.json(rows);
                }
            );
        }
    );
};

// Revoke a specific user's access to your note (owner only)
export const revokeShare = (req, res) => {
    const { noteId, targetUserId } = req.params;
    const userId = req.userId;

    db.query(
        "SELECT owner_id FROM notes WHERE id = ?",
        [noteId],
        (err, data) => {
            if (err) return res.status(500).json({ message: "Database error", error: err });
            if (data.length === 0) return res.status(404).json({ message: "Note not found" });
            if (data[0].owner_id !== userId) return res.status(403).json({ message: "Access denied" });

            db.query(
                "DELETE FROM note_shares WHERE note_id = ? AND shared_with_user_id = ?",
                [noteId, targetUserId],
                (err2, result) => {
                    if (err2) return res.status(500).json({ message: "Database error", error: err2 });
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: "Share record not found" });
                    }
                    res.json({ message: "Access revoked successfully" });
                }
            );
        }
    );
};
