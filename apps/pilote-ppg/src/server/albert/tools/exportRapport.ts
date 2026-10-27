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
      description: `Génère un rapport téléchargeable à partir des données de la conversation : un titre, une date, un résumé et des sections (markdown par défaut, PDF si l'utilisateur le demande).
- Si la conversation ne contient pas les données du rapport, appelle d'abord les outils nécessaires.
- Inclus sous forme de tableau les valeurs des indicateurs de chaque chantier cité (get_indicateurs si besoin).
- Dans un paragraphe, sépare les paragraphes par une ligne vide.
- Après l'appel, réponds seulement « Votre rapport est disponible au téléchargement. », sans lien : l'interface affiche le fichier.
Utilise-le pour : exporter, télécharger ou générer un rapport.
Ne l'utilise pas pour : une question sur l'export des données dans PILOTE → consulter_centre_aide.`,
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
