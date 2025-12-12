import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { createReadStream, statSync } from "fs";
import { join } from "path";
import assert from "node:assert/strict";
import { configuration } from "@/config";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  assert(session);

  const filename = req.query.filename as string | undefined;

  if (!filename) {
    res.status(400).send("Missing filename query parameter");
    return;
  }

  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "");

  const ext = safeFilename.split(".").pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ods: "application/vnd.oasis.opendocument.text",
  };

  const contentType = mimeTypes[ext ?? ""];

  if (!contentType) {
    res.status(415).send("Unsupported file type");
    return;
  }

  try {
    const filePath = join(
      process.cwd(),
      configuration().centreaide.assetsFolder,
      safeFilename,
    );

    const stats = statSync(filePath);

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFilename}"`,
    );
    res.setHeader("Content-Length", stats.size);

    const stream = createReadStream(filePath);
    stream.pipe(res);
    stream.on("error", () => {
      res.status(500).end("Error reading file");
    });
  } catch (err) {
    res.status(404).send("File not found");
  }
}
