import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { RapportInput } from "@/server/albert/rapportInput";
import { buildRapportMarkdown } from "@/server/albert/markdown/buildRapportMarkdown";

export async function exportRapportMarkdown(
  input: RapportInput,
): Promise<{ url: string }> {
  const markdown = buildRapportMarkdown(input);

  const exportId = randomUUID();
  const exportsDir = join(process.cwd(), "public", "exports");

  await mkdir(exportsDir, { recursive: true });
  await writeFile(join(exportsDir, `${exportId}.md`), markdown, "utf-8");

  return { url: `/exports/${exportId}.md` };
}
