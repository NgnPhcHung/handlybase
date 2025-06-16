import { DatabaseClient } from "../../core/databases/databaseClient";


export async function up(db: DatabaseClient): Promise<void> {
  db.execute(`CREATE TABLE IF NOT EXISTS _super_database (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS _app_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  isActive INTEGER NOT NULL DEFAULT 0,
  basicAuth INTEGER DEFAULT 0,
  googleAuth INTEGER DEFAULT 0,
  authenticationType TEXT DEFAULT 'jsonwebtoken'
);`)
}

export async function down(db: DatabaseClient): Promise<void> {
  db.execute(``)
}
    