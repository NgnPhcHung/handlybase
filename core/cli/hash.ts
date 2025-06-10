import { program } from "commander";
import bcrypt from "bcryptjs";

program
  .command("hash")
  .description("Generate admin password")
  .argument("<password>", "Password to hash")
  .action(async (password: string) => {
    try {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);
      console.log(
        "Hashed password, please add this to admin password env: ",
        hash,
      );
    } catch (error) {
      console.log(error);
    }
  });

program.parse();
