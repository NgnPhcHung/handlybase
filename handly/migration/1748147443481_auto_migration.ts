
export async function up(db: any) {
  await db.exec(`ALTER TABLE users RENAME TO users_temp`);
  await db.exec(`CREATE TABLE users (id NUMBER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, email TEXT UNIQUE, password TEXT NOT NULL, updatedAt TEXT, createdAt TEXT, isActive BOOLEAN NOT NULL DEFAULT false)`);
  await db.exec(`INSERT INTO users (id, username, email, password, updatedAt, createdAt, isActive) SELECT id, username, email, password, updatedAt, createdAt, isActive FROM users_temp`);
  await db.exec(`DROP TABLE users_temp`);
}

export async function down(db: any) {
  await db.exec(`ALTER TABLE users RENAME TO users_temp`);
  await db.exec(`CREATE TABLE users (id NUMBER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, email TEXT, password TEXT NOT NULL, updatedAt TEXT, createdAt TEXT, isActive BOOLEAN NOT NULL DEFAULT false)`);
  await db.exec(`INSERT INTO users (id, username, email, password, updatedAt, createdAt, isActive) SELECT id, username, email, password, updatedAt, createdAt, isActive FROM users_temp`);
  await db.exec(`DROP TABLE users_temp`);
}
  