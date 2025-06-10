#!/usr/bin/env node

import { program } from "commander";
import { transformSync } from "esbuild";
import { readdirSync, readFileSync } from "fs";
import * as path from "path";
import vm from "vm";
import { DatabaseClient } from "../databases/databaseClient";
import { DatabaseType } from "../databases/databaseConfig";
import {
  ensureDir,
  get2LastestFile,
  getAllFiles,
  getFilesByRange,
  writeFile,
} from "../utils";
import { generateMigration, loadDatasource } from "./migrationHelper";

const MIGRATION_DIRECTORY = "handly/migration";

type MigrationSingleQuery = { title: string };

const revertMigration = async (
  database: DatabaseClient,
  { migrationFiles }: { migrationFiles?: string[] } = {},
) => {
  try {
    const files = readdirSync(MIGRATION_DIRECTORY).filter((f) =>
      f.endsWith(".ts"),
    );

    const lastIdx = files.length - 1;
    const latestFile = files[lastIdx];
    const tsCode = readFileSync(
      `${MIGRATION_DIRECTORY}/${latestFile}`,
      "utf-8",
    );
    const { code: jsCode } = transformSync(tsCode, {
      loader: "ts",
      format: "cjs",
      target: "esnext",
    });
    const context: Record<string, any> = {
      require,
      console,
      DatabaseClient,
      db: database,
      module: { exports: {} },
      exports: {},
    };

    vm.createContext(context);
    let query = `BEGIN TRANSACTION;\n`;

    if (!!migrationFiles?.length) {
      for (const migration of migrationFiles) {
        query += `DELETE FROM migrations WHERE id = (SELECT migrations.id FROM migrations WHERE title = '${migration}'ORDER BY id DESC LIMIT 1);\n`;
      }
    }

    query += `DELETE FROM migrations WHERE id = (SELECT migrations.id FROM migrations ORDER BY id DESC LIMIT 1);\n`;

    await Promise.resolve(database.execute(query));
    await Promise.resolve(database.execute("COMMIT TRANSACTION;"));
    const script = new vm.Script(jsCode + "\ndown(db);");
    script.runInContext(context);
  } catch (error) {
    console.log(error);
    database.execute(`ROLLBACK TRANSACTION;`);
  }
};

const excuteMigration = async (database: DatabaseClient, file?: string) => {
  try {
    let latestFile = file;
    if (!file) {
      const files = readdirSync(MIGRATION_DIRECTORY).filter((f) =>
        f.endsWith(".ts"),
      );

      const lastIdx = files.length - 1;
      latestFile = files[lastIdx];
    }
    const tsCode = readFileSync(
      `${MIGRATION_DIRECTORY}/${latestFile}`,
      "utf-8",
    );
    const { code: jsCode } = transformSync(tsCode, {
      loader: "ts",
      format: "cjs",
      target: "esnext",
    });
    const context: Record<string, any> = {
      require,
      console,
      DatabaseClient,
      db: database,
      module: { exports: {} },
      exports: {},
    };

    vm.createContext(context);
    Promise.resolve(
      database.execute(
        'CREATE TABLE IF NOT EXISTS migrations( "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "title" text);',
      ),
    );
    Promise.resolve(
      database.execute(
        `INSERT INTO migrations (title) VALUES('${latestFile!.split(".ts")[0]}');`,
      ),
    );
    const script = new vm.Script(jsCode + "\nup(db);");
    script.runInContext(context);
  } catch (error) {
    console.log(`Error file execute migration, please try again: ${error}`);
  }
};

program
  .command("create <name>")
  .option(
    "-c, --config <path>",
    "Path to the datasource config file",
    "./datasource.ts",
  )
  .description("Create a migration file based on datasource config")
  .action(async (name: string, options: { config?: string }) => {
    const database: DatabaseClient = await loadDatasource(options.config!);
    database.connect();
    let formatName = name.split(" ").join("_");
    if (formatName === name) {
      formatName = name;
    }

    let dbType: DatabaseType;
    const typeOfDatabase = database.constructor.name.toLowerCase();
    if (typeOfDatabase.includes("sqlite")) {
      dbType = "sqlite";
    } else {
      throw "Can not found Database type";
    }
    const { newSchema, oldSchema } = await get2LastestFile("handly/snapshot");
    const { upQueries, downQueries } = await generateMigration(
      dbType,
      oldSchema,
      newSchema,
    );

    const migrationDir = path.resolve(process.cwd(), MIGRATION_DIRECTORY);
    await ensureDir(migrationDir);

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14);
    const migrationFile = path.join(
      migrationDir,
      `${timestamp}_${formatName}.ts`,
    );

    const migrationContent = `import { DatabaseClient } from "../../core/databases/databaseClient";


export async function up(db: DatabaseClient): Promise<void> {
  db.execute(\`${upQueries.flatMap((d) => d)}\`)
}

export async function down(db: DatabaseClient): Promise<void> {
  db.execute(\`${downQueries.flatMap((d) => d)}\`)
}
    `;

    await writeFile(migrationFile, migrationContent);
    await excuteMigration(database);
  });

program
  .command("revert")
  .option("-t, --to <file>", "Revert to destination file")
  .option("-a, --all", "Revert all")
  .option(
    "-c, --config <path>",
    "Path to the datasource config file",
    "./datasource.ts",
  )
  .description("Revert migration")
  .action(async (options: { config?: string; to?: string; all?: string }) => {
    const database: DatabaseClient = await loadDatasource(options.config!);
    database.connect();

    let dbType: DatabaseType;
    const typeOfDatabase = database.constructor.name.toLowerCase();

    if (typeOfDatabase.includes("sqlite")) {
      dbType = "sqlite";
      dbType;
    } else {
      throw "Can not found Database type";
    }

    if (options.to) {
      console.log(
        "Revert migration to ",
        await getFilesByRange(MIGRATION_DIRECTORY, options.to),
      );
      const files = await getFilesByRange(MIGRATION_DIRECTORY, options.to);
      revertMigration(database, { migrationFiles: files });
    } else if (options.all) {
      console.log("Revert all migration", getAllFiles(MIGRATION_DIRECTORY));
      const files = getAllFiles(MIGRATION_DIRECTORY);
      revertMigration(database, { migrationFiles: files });
    } else if (options.to && options.all) {
      throw "Error can not revert both state";
    } else {
      console.log("Revert to migration before");
      revertMigration(database);
    }
  });

program
  .command("run")
  .option(
    "-c, --config <path>",
    "Path to the datasource config file",
    "./datasource.ts",
  )
  .description("Run all migration")
  .action(async (options: { config: string }) => {
    const latestMigrationQuery = `SELECT title FROM migrations ORDER BY id DESC LIMIT 1;\n`;
    const files = getAllFiles(MIGRATION_DIRECTORY);
    const database: DatabaseClient = await loadDatasource(options.config);
    database.connect();

    const latestMigration: MigrationSingleQuery[] =
      await database.query(latestMigrationQuery);

    let startIndex = files.indexOf(`${latestMigration[0].title}.ts`);
    let remaningFiles = files.slice(startIndex + 1, files.length);

    try {
      while (remaningFiles.length > 0) {
        const currentfile = remaningFiles[0];

        await excuteMigration(database, `${currentfile}`);
        remaningFiles.shift();
      }
    } catch (error) {
      console.log(`Error while migration, please try again: ${error}`);
      database.execute(`ROLLBACK TRANSACTION;`);
    }
  });

program.parse(process.argv);
