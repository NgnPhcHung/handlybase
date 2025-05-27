import { DatabaseClient } from "../../core/databases/databaseClient";


export async function up(db: DatabaseClient): Promise<void> {
  db.execute(`ALTER TABLE posts RENAME TO posts_temp
CREATE TABLE posts (
"id"  NOT NULL PRIMARY KEY AUTOINCREMENT,
"updatedAt"  NOT NULL DEFAULT CURRENT_TIMESTAMP,
"createdAt"  NOT NULL DEFAULT CURRENT_TIMESTAMP,
"isActive"  NOT NULL DEFAULT 0,
"author"  NOT NULL,
"subauthor"  NOT NULL DEFAULT Nguyen Ngoc Anh,
"notaauthor"  NOT NULL DEFAULT 0
)
INSERT INTO posts SELECT * from posts_temp`)
}

export async function down(db: DatabaseClient): Promise<void> {
  db.execute(``)
}
