import { z } from "zod";
import {
  TypeCommentaireAPI,
  typesCommentaireAPIVersDomaine,
  importCommentaireSchema,
} from "@/validation/import-commentaire";
import {
  TypeDecisionStrategiqueAPI,
  typesDecisionStrategiqueAPIVersDomaine,
  importDecisionStrategiqueSchema,
} from "@/validation/import-decision-strategique";
import {
  TypeObjectifAPI,
  typesObjectifAPIVersDomaine,
  importObjectifSchema,
} from "@/validation/import-objectif";
import { importSyntheseDesResultatsSchema } from "@/validation/import-synthese-des-resultats";
import { NOMS_TYPES_COMMENTAIRES } from "@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository";
import { TypeCommentaireChantier } from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { meteosSaisissables } from "@/server/domain/météo/Météo.interface";

export const domainesCibles = [
  "commentaire",
  "synthese_des_resultats",
  "decision_strategique",
  "objectif",
] as const;
export type DomaineCible = (typeof domainesCibles)[number];

/*
 * Correspondance entre les codes "type" historiques du CSV brut (identiques à ceux
 * stockés en base pour les commentaires, cf. CommentaireSQLRepository) et les codes
 * attendus par le contrat API JSON (import-commentaire.ts). Trois libellés diffèrent
 * entre les deux : freins_a_lever / actions_a_venir / actions_a_valoriser côté CSV et
 * base, contre risques_et_freins_a_lever / solutions_et_actions_a_venir /
 * exemples_concrets_de_reussite côté API.
 */
const domaineCommentaireVersTypeAPI = Object.fromEntries(
  Object.entries(typesCommentaireAPIVersDomaine).map(([typeAPI, domaine]) => [
    domaine,
    typeAPI as TypeCommentaireAPI,
  ]),
) as Record<TypeCommentaireChantier, TypeCommentaireAPI>;

function typeCommentaireCSVVersTypeAPI(typeCSV: string): TypeCommentaireAPI {
  const domaine = NOMS_TYPES_COMMENTAIRES[typeCSV];
  return domaineCommentaireVersTypeAPI[domaine];
}

export function résoudreDomaineCible(typeCSV: string): DomaineCible | null {
  if (typeCSV in NOMS_TYPES_COMMENTAIRES) return "commentaire";
  if (typeCSV === "synthese_des_resultats") return "synthese_des_resultats";
  if (typeCSV in typesDecisionStrategiqueAPIVersDomaine)
    return "decision_strategique";
  if (typeCSV in typesObjectifAPIVersDomaine) return "objectif";
  return null;
}

const dateNonFutureRegex = /^\d{4}-\d{2}-\d{2}$/;

// Une cellule CSV vide arrive comme "" (csv-parse), pas comme undefined : on la
// traite comme "non renseignée" pour les colonnes optionnelles.
function champOptionnelVide<Schema extends z.ZodTypeAny>(schema: Schema) {
  return z.preprocess(
    (valeur) => (valeur === "" ? undefined : valeur),
    schema.optional(),
  );
}

export const ligneCSVDonneesChantierSchema = z.object({
  chantier_id: z.string().min(1, "Le chantier_id ne peut pas être vide"),
  type: z
    .string()
    .min(1, "Le type ne peut pas être vide")
    .refine((typeCSV) => résoudreDomaineCible(typeCSV) !== null, {
      message: "Le type ne correspond à aucun domaine connu",
    }),
  contenu: z
    .string()
    .min(1, "Le contenu ne peut pas être vide")
    .max(10000, "Le contenu ne peut pas dépasser 10000 caractères"),
  date: z
    .string()
    .regex(dateNonFutureRegex, "Le format de la date doit être YYYY-MM-DD")
    .refine(
      (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return date <= today;
      },
      { message: "La date ne peut pas être dans le futur" },
    ),
  auteur_email: champOptionnelVide(z.string()),
  maille: champOptionnelVide(z.enum(["NAT", "REG", "DEPT"])),
  code_insee: champOptionnelVide(z.string()),
  meteo: champOptionnelVide(z.string()),
});

export type LigneCSVDonneesChantier = z.infer<
  typeof ligneCSVDonneesChantierSchema
>;

export type LigneRepartieCommentaire = {
  domaine: "commentaire";
  chantierId: string;
  auteurEmail?: string;
  input: z.infer<typeof importCommentaireSchema>;
};
export type LigneRepartieSyntheseDesResultats = {
  domaine: "synthese_des_resultats";
  chantierId: string;
  auteurEmail?: string;
  input: z.infer<typeof importSyntheseDesResultatsSchema>;
};
export type LigneRepartieDecisionStrategique = {
  domaine: "decision_strategique";
  chantierId: string;
  auteurEmail?: string;
  input: z.infer<typeof importDecisionStrategiqueSchema>;
};
export type LigneRepartieObjectif = {
  domaine: "objectif";
  chantierId: string;
  auteurEmail?: string;
  input: z.infer<typeof importObjectifSchema>;
};

export type LigneRepartie =
  | LigneRepartieCommentaire
  | LigneRepartieSyntheseDesResultats
  | LigneRepartieDecisionStrategique
  | LigneRepartieObjectif;

function territoireDepuisLigne(ligne: LigneCSVDonneesChantier): string {
  return `${ligne.maille || "NAT"}-${ligne.code_insee || "FR"}`;
}

function meteoDepuisLigne(
  ligne: LigneCSVDonneesChantier,
): (typeof meteosSaisissables)[number] | "NON_RENSEIGNEE" {
  const meteo = ligne.meteo;
  return meteo && (meteosSaisissables as readonly string[]).includes(meteo)
    ? (meteo as (typeof meteosSaisissables)[number])
    : "NON_RENSEIGNEE";
}

export function répartirLigne(ligne: LigneCSVDonneesChantier): LigneRepartie {
  const domaine = résoudreDomaineCible(ligne.type);

  switch (domaine) {
    case "commentaire":
      return {
        domaine,
        chantierId: ligne.chantier_id,
        auteurEmail: ligne.auteur_email,
        input: {
          territoire: territoireDepuisLigne(ligne),
          type: typeCommentaireCSVVersTypeAPI(ligne.type),
          contenu: ligne.contenu,
          date_commentaire: ligne.date,
        },
      };
    case "synthese_des_resultats":
      return {
        domaine,
        chantierId: ligne.chantier_id,
        auteurEmail: ligne.auteur_email,
        input: {
          territoire: territoireDepuisLigne(ligne),
          contenu: ligne.contenu,
          // NON_RENSEIGNEE n'est pas une météo "saisissable" côté API mais reste une
          // valeur valide en base (colonne nullable) — même comportement que le
          // COALESCE du modèle dbt synthese_des_resultats.sql qu'on remplace.
          meteo: meteoDepuisLigne(ligne) as z.infer<
            typeof importSyntheseDesResultatsSchema
          >["meteo"],
          date_synthese: ligne.date,
        },
      };
    case "decision_strategique":
      return {
        domaine,
        chantierId: ligne.chantier_id,
        auteurEmail: ligne.auteur_email,
        input: {
          type: ligne.type as TypeDecisionStrategiqueAPI,
          contenu: ligne.contenu,
          date_decision_strategique: ligne.date,
        },
      };
    case "objectif":
      return {
        domaine,
        chantierId: ligne.chantier_id,
        auteurEmail: ligne.auteur_email,
        input: {
          type: ligne.type as TypeObjectifAPI,
          contenu: ligne.contenu,
          date_objectif: ligne.date,
        },
      };
    default:
      // Impossible : ligneCSVDonneesChantierSchema rejette déjà les types inconnus.
      throw new Error(`Type de ligne non résolu : ${ligne.type}`);
  }
}

export type ErreurLigneCSVDonneesChantier = {
  ligne: number;
  chantierId?: string;
  type?: string;
  message: string;
};

export function validerLignesCSV(lignesBrutes: unknown[]): {
  lignesValides: LigneCSVDonneesChantier[];
  erreurs: ErreurLigneCSVDonneesChantier[];
} {
  const lignesValides: LigneCSVDonneesChantier[] = [];
  const erreurs: ErreurLigneCSVDonneesChantier[] = [];

  lignesBrutes.forEach((ligneBrute, index) => {
    const résultat = ligneCSVDonneesChantierSchema.safeParse(ligneBrute);

    if (!résultat.success) {
      const ligneBruteObjet = ligneBrute as Record<string, unknown>;
      résultat.error.issues.forEach((issue) => {
        erreurs.push({
          ligne: index,
          chantierId:
            typeof ligneBruteObjet?.chantier_id === "string"
              ? ligneBruteObjet.chantier_id
              : undefined,
          type:
            typeof ligneBruteObjet?.type === "string"
              ? ligneBruteObjet.type
              : undefined,
          message: issue.message,
        });
      });
      return;
    }

    lignesValides.push(résultat.data);
  });

  return { lignesValides, erreurs };
}
