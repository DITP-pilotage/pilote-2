import { loadEnvConfig } from "@next/env";
import process from "node:process";

const projectDir = process.cwd();
loadEnvConfig(projectDir);
