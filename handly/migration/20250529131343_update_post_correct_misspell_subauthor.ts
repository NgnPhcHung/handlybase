import { DatabaseClient } from "../../core/databases/databaseClient";


    export async function up(db: DatabaseClient): Promise<void> {
      db.execute(`ALTER TABLE posts RENAME TO posts_temp;
CREATE TABLE posts (
"id"  INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
"updatedAt"  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
"createdAt"  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
"isActive"  INTEGER NOT NULL DEFAULT 0,
"author"  INTEGER NOT NULL,
"subAuthor"  INTEGER NOT NULL
);
INSERT INTO posts SELECT * from posts_temp;
DROP TABLE posts_temp;`)
    }

    export async function down(db: DatabaseClient): Promise<void> {
      db.execute(``)
    }
    