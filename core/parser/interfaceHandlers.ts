import { writeFile, mkdir } from "fs/promises";
import { toCapitalize } from "../utils/string";
import { FieldProperties } from "./sqlTokens";
import { existsSync } from "fs";

const header = `
\`
--------------------------------------------
THIS FILE AUTOMATIC GENERATE, PLEASE DON'T TOUCH
--------------------------------------------
\`
\n\n\n
`;

export const interfaceHanlders = (name: string) => {
  const collectionName = `export class ${toCapitalize(name)}`;
  let collectionProperties = "";

  const toPropety = (field: FieldProperties) => {
    const required = !!field.required ? field.required : true;
    collectionProperties += `\t${field.name}`;
    collectionProperties += `${required ? "!" : "?"}: `;
    collectionProperties += `${field.type === "text" ? "string" : field.type}`;
    collectionProperties += ";\n";
  };

  const toInterfaceFile = async () => {
    const filePath = `./src/entities/`;
    const fileName = `schemas.ts`;

    try {
      collectionProperties = " {\n" + collectionProperties + "}\n";
      const collectionContents = header + collectionName + collectionProperties;
      if (!existsSync(filePath)) {
        await mkdir(filePath, { recursive: true });
      }
      await writeFile(`${filePath}${fileName}`, collectionContents, {
        encoding: "utf-8",
      });
      console.log(
        `File created success, now you can access ${filePath} for more info`,
      );
    } catch (error) {
      throw new Error("Failed to create interface for entity: " + error);
    }
  };

  return {
    toPropety,
    toInterfaceFile,
  };
};
