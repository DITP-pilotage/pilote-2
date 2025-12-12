import type { NextApiRequest, NextApiResponse } from "next";
import { readFile } from "fs/promises";
import { join } from "path";
import { configuration } from "@/config";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const filename = req.query.filename as string | undefined;

  if (!filename) {
    res.status(400).send("Missing filename query parameter");
    return;
  }

  // Sécurisation du nom de fichier
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "");

  // Détection MIME
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
    const fileBuffer = await readFile(filePath);

    // Headers pour forcer le téléchargement
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFilename}"`,
    );
    res.send(fileBuffer);
  } catch (err) {
    res.status(404).send("File not found");
  }
}
