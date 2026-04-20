import { tool } from "ai";
import { randomUUID } from "crypto";
import { genererRapportPDF } from "@/server/albert/pdf/genererRapportPDF";
import { buildRapportMarkdown } from "@/server/albert/markdown/buildRapportMarkdown";
import type { RapportFileStorage } from "@/server/albert/domain/RapportFileStorage";
import {
  exportRapportInputSchema,
  type ExportRapportOutput,
} from "@/server/albert/exportRapportSchema";

export function createExportRapportTool({
  rapportFileStorage,
}: {
  rapportFileStorage: RapportFileStorage;
}) {
  return ({ userId }: { userId: string }) => {
    return tool({
      description:
        "Génère un rapport structuré synthétisant la discussion. Appelle cet outil quand l'utilisateur demande d'exporter ou télécharger un rapport. Le rapport doit contenir un titre, une date, un résumé et des sections structurées reprenant les données clés de la conversation.",
      inputSchema: exportRapportInputSchema,
      execute: async (input): Promise<ExportRapportOutput> => {
        const shortId = randomUUID().slice(0, 8);
        const ext = input.format === "pdf" ? "pdf" : "md";
        const filename = `${input.nom_fichier}-${shortId}.${ext}`;

        if (input.format === "pdf") {
          const buffer = await genererRapportPDF(input);
          const url = await rapportFileStorage.save(userId, filename, buffer);
          return { url, format: "pdf" };
        }

        const markdown = buildRapportMarkdown(input);
        const url = await rapportFileStorage.save(userId, filename, markdown);
        return { url, format: "markdown" };
      },
    });
  };
}
