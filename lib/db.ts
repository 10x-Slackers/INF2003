import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: "mariadb",
  user: "root",
  password: "P@ssw0rd",
  database: "inf2003",
});
