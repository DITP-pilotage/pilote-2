import { z } from "zod";
import { TypeCommentaireChantier } from "@/server/domain/chantier/commentaire/Commentaire.interface";

export const typesCommentaireAPIVersDomaineNational = {
  autres_resultats_obtenus_non_correles_aux_indicateurs:
    "autresRésultatsObtenusNonCorrélésAuxIndicateurs",
  risques_et_freins_a_lever: "risquesEtFreinsÀLever",
  solutions_et_actions_a_venir: "solutionsEtActionsÀVenir",
  exemples_concrets_de_reussite: "exemplesConcretsDeRéussite",
} as const;

export const typesCommentaireAPIVersDomaineRegionalDepartemental = {
  commentaires_sur_les_donnees: "commentairesSurLesDonnées",
  autres_resultats_obtenus: "autresRésultatsObtenus",
} as const;

export const typesCommentaireAPIVersDomaine = {
  ...typesCommentaireAPIVersDomaineNational,
  ...typesCommentaireAPIVersDomaineRegionalDepartemental,
} as const;

export type TypeCommentaireAPI = keyof typeof typesCommentaireAPIVersDomaine;

const tousLesTypesCommentaireAPI = Object.keys(
  typesCommentaireAPIVersDomaine,
) as [TypeCommentaireAPI, ...TypeCommentaireAPI[]];

export const typesCommentaireAPINationaux = Object.keys(
  typesCommentaireAPIVersDomaineNational,
) as TypeCommentaireAPI[];

export const typesCommentaireAPIRegionauxDepartementaux = Object.keys(
  typesCommentaireAPIVersDomaineRegionalDepartemental,
) as TypeCommentaireAPI[];

export function mapTypeCommentaireAPIVersDomaine(
  typeAPI: TypeCommentaireAPI,
): TypeCommentaireChantier {
  return typesCommentaireAPIVersDomaine[typeAPI];
}

export const importCommentaireSchema = z.object({
  territoire: z
    .string()
    .regex(
      /^(NAT|REG|DEPT)-[A-Z0-9]+$/,
      "Le format du territoire doit être NAT-XX, REG-XX ou DEPT-XX",
    ),
  type: z.enum(tousLesTypesCommentaireAPI, {
    errorMap: () => ({
      message: `Le type de commentaire doit être l'un des suivants : ${tousLesTypesCommentaireAPI.join(", ")}`,
    }),
  }),
  contenu: z
    .string()
    .min(1, "Le contenu ne peut pas être vide")
    .max(10000, "Le contenu ne peut pas dépasser 10000 caractères"),
  date_commentaire: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Le format de la date doit être YYYY-MM-DD")
    .refine(
      (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return date <= today;
      },
      {
        message: "La date du commentaire ne peut pas être dans le futur",
      },
    )
    .optional(),
});

export const importCommentairesSchema = z.object({
  commentaires: z
    .array(importCommentaireSchema)
    .min(1, "Au moins un commentaire est requis"),
});

export type ImportCommentaireInput = z.infer<typeof importCommentaireSchema>;
export type ImportCommentairesInput = z.infer<typeof importCommentairesSchema>;
