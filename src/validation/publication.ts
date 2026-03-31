import { z } from "zod";
import { extractVisibleText } from "@/client/utils/html/extractVisibleText";
import {
  typesCommentaireMailleNationale,
  typesCommentaireMailleRégionaleOuDépartementale,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { typesObjectif } from "@/server/domain/chantier/objectif/Objectif.interface";
import { typesDecisionStrategique } from "@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface";

export const LIMITE_CARACTÈRES_PUBLICATION = Number.parseInt(
  process.env.NEXT_PUBLIC_LIMITE_CARACTERES_PUBLICATION || "5000",
);

export const zodValidateurCSRF = z.object({
  csrf: z.string(),
});

export const validationPublicationContexte = z.object({
  typeDeRéforme: z.string(),
  réformeId: z.string(),
  territoireCode: z.string(),
});

export const zodValidateurEntitéType = z.union([
  z.object({
    entité: z.literal("commentaires"),
    type: z.enum([
      ...typesCommentaireMailleNationale,
      ...typesCommentaireMailleRégionaleOuDépartementale,
    ]),
  }),
  z.object({
    entité: z.literal("objectifs"),
    type: z.enum([...typesObjectif]),
  }),
  z.object({
    entité: z.literal("décisions stratégiques"),
    type: z.enum(typesDecisionStrategique),
  }),
]);

export const zodValidateurEntité = z.object({
  entité: z.enum(["commentaires", "objectifs", "décisions stratégiques"]),
});

export const validationPublicationFormulaire = validationPublicationContexte
  .and(zodValidateurEntitéType)
  .and(
    z.object({
      contenu: z
        .string()
        .refine(
          (html) => extractVisibleText(html).trim().length >= 1,
          "Ce champ ne peut pas être vide",
        )
        .refine(
          (html) =>
            extractVisibleText(html).length <= LIMITE_CARACTÈRES_PUBLICATION,
          `La limite maximale de ${LIMITE_CARACTÈRES_PUBLICATION} caractères a été dépassée`,
        ),

      territoireCode: z.string(),
      réformeId: z.string(),
      typeDeRéforme: z.string(),
    }),
  );
