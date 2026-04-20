import { z } from "zod";

export const exportRapportInputSchema = z.object({
  nom_fichier: z
    .string()
    .refine(
      (value) => !value.includes("/") && !value.includes("\\"),
      "Le nom de fichier ne doit pas contenir de slash",
    )
    .describe(
      "Nom du fichier sans extension, en kebab-case (ex: synthese-ile-de-france-2025)",
    ),
  titre: z.string().describe("Titre principal du rapport"),
  date: z.string().describe("Date du rapport au format JJ/MM/AAAA"),
  resume: z.string().describe("Résumé synthétique du rapport en 2-3 phrases"),
  format: z
    .enum(["markdown", "pdf"])
    .default("markdown")
    .describe(
      "Format du rapport. Par défaut markdown. Utilise pdf uniquement si l'utilisateur le demande explicitement.",
    ),
  sections: z
    .array(
      z.object({
        titre: z.string().describe("Titre de la section"),
        parties: z
          .array(
            z.discriminatedUnion("type", [
              z.object({
                type: z.literal("paragraphe"),
                contenu: z.string().describe("Texte du paragraphe"),
              }),
              z.object({
                type: z.literal("tableau"),
                en_tetes: z.array(z.string()).describe("En-têtes des colonnes"),
                lignes: z
                  .array(z.array(z.string()))
                  .describe("Lignes du tableau"),
              }),
            ]),
          )
          .describe("Parties de la section, dans l'ordre d'affichage"),
      }),
    )
    .describe("Sections du rapport"),
});

export type ExportRapportOutput = { url: string; format: "markdown" | "pdf" };
