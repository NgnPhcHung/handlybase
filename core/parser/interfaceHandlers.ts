import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import { appendOrCreate, toCapitalize } from "../../core/utils";
import { FieldProperties } from "./sqlTokens";
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

  const props: string[] = [];

  const toPropety = (field: FieldProperties) => {
    const required = field.required ?? true;
    const line = `\t${field.name}${required ? "!" : "?"}: ${field.type === "text" ? "string" : field.type};`;
    props.push(line);
  };

  const values = () => {
    const collectionProperties = " {\n" + props.join("\n") + "\n}\n";
    const collectionContents = collectionName + collectionProperties;
    return collectionContents;
  };

  const toInterfaceFile = async (
    fpath: string,
    fname: string,
    fvalue: string,
  ) => {
    const filePath = fpath;
    const fileName = fname;

    try {
      // await rm(filePath, { recursive: true, force: true });
      if (!existsSync(filePath)) {
        await mkdir(filePath, { recursive: true });
      }

      await appendOrCreate(`${filePath}${fileName}`, `${header} ${fvalue}`);
    } catch (error) {
      throw new Error("Failed to create interface for entity: " + error);
    }
  };

  return {
    toPropety,
    toInterfaceFile,
    values,
  };
};
