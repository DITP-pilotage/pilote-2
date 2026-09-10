import { getPrisma } from "@/server/db/PrismaTransaction";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import type { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";

/**
 * Le monde sur lequel les evals raisonnent.
 *
 * Les questions des cas pointent sur CES chantiers-là, pas sur ceux de la base
 * de dev : c'est ce qui rend un score comparable d'une semaine sur l'autre.
 *
 * Le volume n'est pas arbitraire. `search_chantiers` injecte la liste ENTIÈRE
 * des chantiers accessibles dans le prompt de son sous-agent : avec cinq
 * chantiers, retrouver « le chantier sur les VSS » est trivial et le score ne
 * dit plus rien de l'agent réel. D'où une vingtaine d'intitulés, groupés par
 * thème et volontairement proches — plusieurs chantiers « santé », plusieurs
 * « logement », plusieurs « égalité femmes-hommes » — pour que la sélection ait
 * quelque chose à discriminer, et que `display_choices` ait de vrais candidats
 * ambigus à proposer.
 */

export type EvalWorld = {
  userId: string;
  habilitations: Habilitations;
  chantiers: { id: string; nom: string }[];
};

/**
 * Identifiants stables et lisibles : un cas d'eval qui échoue doit pouvoir se
 * rejouer à la main. Pas d'aléatoire — l'isolation vient de la transaction.
 */
const CHANTIERS = [
  { id: "CH-001", nom: "Lutter contre les violences sexistes et sexuelles" },
  {
    id: "CH-002",
    nom: "Protéger les femmes victimes de violences conjugales",
  },
  {
    id: "CH-003",
    nom: "Renforcer l'égalité professionnelle entre les femmes et les hommes",
  },
  {
    id: "CH-004",
    nom: "Améliorer l'accès aux soins dans les déserts médicaux",
  },
  { id: "CH-005", nom: "Réduire les délais de passage aux urgences" },
  { id: "CH-006", nom: "Développer la prévention en santé" },
  { id: "CH-007", nom: "Rénover énergétiquement les logements privés" },
  { id: "CH-008", nom: "Lutter contre l'habitat indigne" },
  { id: "CH-009", nom: "Produire davantage de logements sociaux" },
  {
    id: "CH-010",
    nom: "Améliorer l'accessibilité des lieux publics aux personnes handicapées",
  },
  {
    id: "CH-011",
    nom: "Faciliter l'accès à l'emploi des personnes en situation de handicap",
  },
  { id: "CH-012", nom: "Développer l'apprentissage" },
  {
    id: "CH-013",
    nom: "Accompagner les demandeurs d'emploi de longue durée",
  },
  { id: "CH-014", nom: "Réduire la mortalité sur les routes" },
  { id: "CH-015", nom: "Développer les énergies renouvelables" },
  {
    id: "CH-016",
    nom: "Réduire les émissions de gaz à effet de serre des transports",
  },
  { id: "CH-017", nom: "Dédoubler les classes en éducation prioritaire" },
  {
    id: "CH-018",
    nom: "Améliorer la maîtrise des savoirs fondamentaux à l'école",
  },
  { id: "CH-019", nom: "Déployer le très haut débit sur tout le territoire" },
  { id: "CH-020", nom: "Lutter contre l'illectronisme" },
];

/**
 * Chantiers dotés de données rattachées. Les tools de détail (indicateurs,
 * commentaires, objectifs) renverraient sinon du vide, ce qui pousse l'agent à
 * enchaîner d'autres appels et brouille la mesure de sélection d'outils.
 */
const CHANTIERS_DETAILLES = ["CH-001", "CH-004", "CH-007"];

export const NATIONAL_TERRITORY = "NAT-FR";

/**
 * Rattachement régional réel, relevé sur la base de dev.
 *
 * Les cas qui portent sur `en_retard` ou `en_difficulte` doivent viser une
 * région : au national, `get_chantiers` renvoie `non_applicable`, l'écart à la
 * médiane supposant des territoires comparables.
 */
export const BRETAGNE = {
  territoire_code: "REG-53",
  code_insee: "53",
  maille: "REG" as const,
  zone_id: "R53",
};

/**
 * Durée de vie de la transaction d'un cas. Un tour d'agent attend le réseau
 * pendant qu'elle est ouverte ; les cas qui passent par `search_chantiers`,
 * lui-même un sous-agent LLM, dépassent 180 s. Reste sous le `testTimeout`
 * d'Evalite, pour que ce soit le runner qui arbitre en dernier ressort.
 */
export const EVAL_TIMEOUT_MS = 400_000;

async function seedChantierDetaille({
  chantierId,
  auteurId,
}: {
  chantierId: string;
  auteurId: string;
}) {
  // `est_applicable` n'a pas de valeur par defaut en base et le `where` de
  // GetChantiersQuery filtre dessus : sans ce champ, le chantier n'existe pas
  // pour l'outil, sans qu'aucune erreur ne le signale.
  await fixtures.chantierTerritoire({
    id: chantierId,
    territoire_code: NATIONAL_TERRITORY,
    code_insee: "FR",
    maille: "NAT",
    zone_id: "FRANCE",
    est_applicable: true,
  });

  const indicateur = await fixtures.indicateurIdentite({
    chantier_id: chantierId,
    id: `IND-${chantierId.slice(3)}`,
    nom: `Indicateur principal du ${chantierId}`,
  });

  await fixtures.indicateurTerritoire({
    id: indicateur.id,
    chantier_id: chantierId,
    territoire_code: NATIONAL_TERRITORY,
  });

  await fixtures.commentaire({
    chantier_id: chantierId,
    territoire_code: NATIONAL_TERRITORY,
    maille: "NAT",
    code_insee: "FR",
    type: "autres_resultats_obtenus",
    contenu: `Point d'avancement sur le ${chantierId}.`,
    auteur_creation_id: auteurId,
    auteur_modification_id: auteurId,
  });

  await fixtures.objectifChantier({
    chantier_id: chantierId,
    type: "notre_ambition",
    contenu: `Objectif principal du ${chantierId}.`,
    auteur_creation_id: auteurId,
    auteur_modification_id: auteurId,
  });
}

/**
 * L'utilisateur n'est pas décoratif : `llm_calls.utilisateur_id` porte une clé
 * étrangère, et l'assistant y écrit à chaque tour comme en production.
 */
export async function seedEvalWorld(): Promise<EvalWorld> {
  const utilisateur = await fixtures.utilisateur({});

  for (const chantier of CHANTIERS) {
    await fixtures.chantierIdentite(chantier);
  }

  for (const chantierId of CHANTIERS_DETAILLES) {
    await seedChantierDetaille({ chantierId, auteurId: utilisateur.id });
  }

  const chantiersAccessibles = CHANTIERS.map((chantier) => chantier.id);

  // Les territoires ne sont pas semés : `integrationTestSetup` les épargne du
  // TRUNCATE, comme le référentiel des profils. On prend donc le référentiel
  // réel — sinon une question sur la Bretagne porterait sur un territoire
  // inexistant, et l'agent aurait raison de ne pas appeler l'outil.
  const territoires = await getPrisma().territoire.findMany();
  const territoiresAccessibles = territoires.map(
    (territoire) => territoire.code,
  );

  const perimetreComplet = {
    chantiers: chantiersAccessibles,
    territoires: territoiresAccessibles,
    périmètres: [],
  };

  return {
    userId: utilisateur.id,
    chantiers: CHANTIERS,
    habilitations: {
      lecture: perimetreComplet,
      saisieCommentaire: perimetreComplet,
      saisieIndicateur: perimetreComplet,
      responsabilite: perimetreComplet,
      gestionUtilisateur: perimetreComplet,
    },
  };
}
