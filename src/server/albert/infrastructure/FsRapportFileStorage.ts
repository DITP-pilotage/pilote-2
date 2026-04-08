import { tmpdir } from "os";
import { join } from "path";
import { mkdir, writeFile, readdir, stat, unlink, rmdir } from "fs/promises";
import { createReadStream, existsSync } from "fs";
import { Readable } from "stream";
import type { RapportFileStorage } from "@/server/albert/domain/RapportFileStorage";

const BASE_DIR = join(tmpdir(), "pilote-rapports");

const CONTENT_TYPES: Record<string, string> = {
  md: "text/markdown; charset=utf-8",
  pdf: "application/pdf",
};

export class FsRapportFileStorage implements RapportFileStorage {
  async save(
    userId: string,
    filename: string,
    content: Buffer | string,
  ): Promise<string> {
    const dir = join(BASE_DIR, userId);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), content);

    return `/api/albert/rapports/${userId}/${filename}`;
  }

  async read(
    userId: string,
    filename: string,
  ): Promise<{ stream: ReadableStream; contentType: string } | null> {
    const filePath = join(BASE_DIR, userId, filename);

    if (!existsSync(filePath)) return null;

    const ext = filename.split(".").pop() ?? "";
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
    const nodeStream = createReadStream(filePath);
    const stream = Readable.toWeb(nodeStream) as ReadableStream;

    return { stream, contentType };
  }

  async deleteOlderThan(maxAgeMs: number): Promise<number> {
    if (!existsSync(BASE_DIR)) return 0;

    const now = Date.now();
    let deleted = 0;

    const userDirs = await readdir(BASE_DIR);

    for (const userDir of userDirs) {
      const userPath = join(BASE_DIR, userDir);
      const userStat = await stat(userPath);
      if (!userStat.isDirectory()) continue;

      const files = await readdir(userPath);

      for (const file of files) {
        const filePath = join(userPath, file);
        const fileStat = await stat(filePath);

        if (now - fileStat.mtimeMs > maxAgeMs) {
          await unlink(filePath);
          deleted++;
        }
      }

      const remaining = await readdir(userPath);
      if (remaining.length === 0) {
        await rmdir(userPath);
      }
    }

    return deleted;
  }
}
