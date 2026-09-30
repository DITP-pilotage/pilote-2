import { randomUUID } from "node:crypto";
import { getPrisma } from "@/server/db/PrismaTransaction";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import type { TypeContenuChantier } from "@/server/chantiers/query/GetChantierCommentairesQuery";
import type { TerritoireRef } from "../seeds";
import { indicateurDuChantier } from "../world";

export type Meteo = "SOLEIL" | "COUVERT" | "NUAGE" | "ORAGE";

export type SeededChantier = {
  chantierId: string;
  /** Taux d'avancement du chantier sur le territoire, au jalon. */
  taux: number;
  /** Écart à la médiane, en points. En retard si <= -10. */
  ecart: number;
  /** En difficulté si NUAGE ou ORAGE et pas en retard. */
  meteo: Meteo;
  /** `null` : la synthèse existe, sans commentaire. */
  commentaireSynthese: string | null;
  indicateur: {
    valeurInitiale: number;
    valeurActuelle: number;
    valeurCible: number;
    tauxAvancement: number;
  };
  /**
   * Commentaires typés. Sur une région ou un département, seuls les types
   * territoriaux sont visibles.
   */
  commentaires?: { type: TypeContenuChantier; contenu: string }[];
};

// Date fixe : une date du jour rendrait les réponses différentes d'un run à
// l'autre dès qu'Albert cite la date d'un commentaire.
const DATE_SAISIE = new Date("2026-09-15T10:00:00Z");

/**
 * Sème un territoire complet à un jalon : ce que les outils de synthèse, de
 * comparaison, d'indicateurs et de commentaires lisent.
 *
 * Les valeurs d'indicateur vont dans `indicateur_territoire_jalon` : c'est la
 * table que lit `get_indicateurs`. Les seeds du niveau 2 les écrivent dans
 * `indicateur_territoire`, où l'outil ne les voit pas.
 */
export async function seedTerritoire({
  territoire,
  jalon,
  chantiers,
  authorId,
}: {
  territoire: TerritoireRef;
  jalon: number;
  chantiers: SeededChantier[];
  authorId: string;
}) {
  for (const chantier of chantiers) {
    // `est_applicable` n'a pas de valeur par défaut en base et le `where` de
    // GetChantiersQuery filtre dessus : sans ce champ, le chantier n'existe pas
    // pour l'outil, sans qu'aucune erreur ne le signale.
    await fixtures.chantierTerritoire({
      id: chantier.chantierId,
      ...territoire,
      meteo: chantier.meteo,
      ecart: chantier.ecart,
      taux_avancement_mandat: chantier.taux,
      est_applicable: true,
    });

    await fixtures.chantierTerritoireJalon({
      id: chantier.chantierId,
      ...territoire,
      jalon,
      ecart: chantier.ecart,
      taux_avancement: chantier.taux,
    });

    // Créée sans la fixture : `fixtures.syntheseDesResultats` remplace un
    // commentaire `null` par « Synthèse de test », et le chantier sans
    // commentaire est ce qui force la règle « Pas de commentaire disponible ».
    await getPrisma().synthese_des_resultats.create({
      data: {
        id: randomUUID(),
        chantier_id: chantier.chantierId,
        territoire_code: territoire.territoire_code,
        maille: territoire.maille,
        code_insee: territoire.code_insee,
        meteo: chantier.meteo,
        commentaire: chantier.commentaireSynthese,
        auteur_creation_id: authorId,
        date_creation: DATE_SAISIE,
        auteur_modification_id: authorId,
        date_modification: DATE_SAISIE,
      },
    });

    const indicateurId = indicateurDuChantier(chantier.chantierId);

    await fixtures.indicateurTerritoire({
      id: indicateurId,
      chantier_id: chantier.chantierId,
      ...territoire,
      est_applicable: true,
      valeur_initiale: chantier.indicateur.valeurInitiale,
    });

    await fixtures.indicateurTerritoireJalon({
      id: indicateurId,
      ...territoire,
      jalon,
      valeur_actuelle: chantier.indicateur.valeurActuelle,
      valeur_cible: chantier.indicateur.valeurCible,
      taux_avancement: chantier.indicateur.tauxAvancement,
    });

    for (const commentaire of chantier.commentaires ?? []) {
      await fixtures.commentaire({
        chantier_id: chantier.chantierId,
        territoire_code: territoire.territoire_code,
        maille: territoire.maille,
        code_insee: territoire.code_insee,
        type: commentaire.type,
        contenu: commentaire.contenu,
        auteur_creation_id: authorId,
        auteur_modification_id: authorId,
        date_creation: DATE_SAISIE,
        date_modification: DATE_SAISIE,
      });
    }
  }
}

/**
 * Un jalon de plus pour des chantiers déjà semés par `seedTerritoire` : seul
 * le taux au jalon change, ce que lisent les comparaisons entre jalons.
 */
export async function seedJalon({
  territoire,
  jalon,
  chantiers,
}: {
  territoire: TerritoireRef;
  jalon: number;
  chantiers: { chantierId: string; taux: number; ecart: number }[];
}) {
  for (const chantier of chantiers) {
    await fixtures.chantierTerritoireJalon({
      id: chantier.chantierId,
      ...territoire,
      jalon,
      ecart: chantier.ecart,
      taux_avancement: chantier.taux,
    });
  }
}
