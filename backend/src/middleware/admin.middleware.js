import jwt from "jsonwebtoken";

// Middleware: only allow requests with a valid superadmin token
export const verifySuperAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "superadmin") {
            return res.status(403).json({ message: "Access denied: superadmin only" });
        }
        req.userId = decoded.id;
        req.role   = decoded.role;
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid token" });
    }
};
