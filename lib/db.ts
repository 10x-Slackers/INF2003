import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "mariadb",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "P@ssw0rd",
  database: process.env.DB_NAME || "inf2003",
});
