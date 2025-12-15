import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { createReadStream, statSync } from "fs";
import { join } from "path";
import { configuration } from "@/config";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).send("Unauthorized");
    return;
  }

  const filename = req.query.filename as string | undefined;

  if (!filename) {
    res.status(400).send("Missing filename query parameter");
    return;
  }

  const safeRegex = /^[a-zA-Z0-9_]+\.(xlsx|ods)$/;

  if (!safeRegex.test(filename)) {
    res.status(400).send("Invalid filename");
    return;
  }

  const ext = filename.split(".").pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ods: "application/vnd.oasis.opendocument.spreadsheet",
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
      filename,
    );

    const stats = statSync(filePath);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", stats.size);

    const stream = createReadStream(filePath);
    stream.pipe(res);
    stream.on("error", () => {
      res.status(500).end("Error reading file");
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Error serving file "${filename}":`, err);
    res.status(404).send("File not found");
  }
}
