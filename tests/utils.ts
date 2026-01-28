import { execSync } from "child_process";

export const seedDatabase = () =>
  execSync("./tests/seed/seed.sh", {
    stdio: "inherit",
    cwd: process.cwd(),
  });
