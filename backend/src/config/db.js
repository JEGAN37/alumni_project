import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

export const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "Mysql123",
    database: process.env.DB_NAME || "saas_notepad"
});

