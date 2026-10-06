import type { GetTauxAvancementTerritoireResult } from "@/server/albert/tools/getTauxAvancementTerritoire";
import type { GetChantierCommentairesOutput } from "@/server/albert/tools/getChantierCommentaires";
import type { GetChantiersResult } from "@/server/chantiers/query/GetChantiersQuery";
import type { GetChantierIndicateursResult } from "@/server/chantiers/query/GetChantierIndicateursQuery";

/**
 * La forme de la fiche de vérité, et ce qu'on en déduit, sans rien charger du
 * serveur : les critères et la calibration l'importent dans des tests
 * unitaires. La lecture elle-même vit dans `groundTruth.ts`.
 */

/** Ce que la fiche doit lire pour un cas. */
export type TruthScope = {
  territoires: string[];
  /** Défaut : le jalon courant. */
  jalons?: number[];
  includeSousTerritoires?: boolean;
  /** Chantiers dont la fiche lit les commentaires, sur le premier territoire. */
  chantiersCommentes?: string[];
  /** Lit les indicateurs des chantiers en retard et en difficulté. */
  indicateurs?: boolean;
};

export type GroundTruth = {
  territoires: { code: string; nom: string; maille: string }[];
  tauxAvancement: GetTauxAvancementTerritoireResult[];
  chantiersEnRetard: GetChantiersResult[];
  chantiersEnDifficulte: GetChantiersResult[];
  indicateurs: GetChantierIndicateursResult[];
  commentaires: GetChantierCommentairesOutput[];
};

type ChantierRef = { id: string; nom: string };

export function chantiersDistincts(
  resultats: GetChantiersResult[],
): ChantierRef[] {
  const parId = new Map<string, string>();
  for (const resultat of resultats) {
    for (const chantier of resultat.chantiers) {
      parId.set(chantier.chantier.id, chantier.chantier.nom);
    }
  }

  return [...parId.entries()]
    .sort(([idA], [idB]) => idA.localeCompare(idB))
    .map(([id, nom]) => ({ id, nom }));
}

/**
 * Les commentaires de synthèse de la fiche, chantier par chantier et
 * territoire par territoire : `null` quand la synthèse n'en a pas, ou qu'il
 * est masqué hors du périmètre de l'utilisateur.
 */
export function synthesesDesChantiers(truth: GroundTruth): {
  chantierId: string;
  territoireCode: string;
  commentaire: string | null;
}[] {
  return [...truth.chantiersEnRetard, ...truth.chantiersEnDifficulte].flatMap(
    (resultat) =>
      resultat.chantiers.map((chantier) => ({
        chantierId: chantier.chantier.id,
        territoireCode: resultat.territoire_code,
        commentaire: chantier.synthese?.commentaire ?? null,
      })),
  );
}

/** Les chantiers qu'une réponse doit citer, sans doublon, triés par identifiant. */
export function chantiersAttendus({
  truth,
  view,
}: {
  truth: GroundTruth;
  view: "en_retard" | "en_difficulte" | "tous";
}): ChantierRef[] {
  if (view === "en_retard") return chantiersDistincts(truth.chantiersEnRetard);
  if (view === "en_difficulte") {
    return chantiersDistincts(truth.chantiersEnDifficulte);
  }
  return chantiersDistincts([
    ...truth.chantiersEnRetard,
    ...truth.chantiersEnDifficulte,
  ]);
}
