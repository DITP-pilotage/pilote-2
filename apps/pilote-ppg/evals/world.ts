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
 * Un indicateur par chantier, aux libellés réalistes : `search_indicateurs`
 * injecte la liste entière dans le prompt de son sous-agent, comme
 * `search_chantiers` pour les chantiers. Des libellés génériques
 * (« Indicateur du CH-001 ») rendraient chaque recherche vide, et l'agent
 * rebondirait sur d'autres outils.
 *
 * L'identifiant reprend le numéro du chantier (IND-001 pour CH-001), sauf
 * IND-894 : un identifiant à trois chiffres qui ne double aucun chantier, pour
 * les cas qui citent un indicateur par son numéro (« l'indicateur 894 »).
 */
const INDICATEURS = [
  {
    id: "IND-001",
    chantier_id: "CH-001",
    nom: "Nombre de victimes de violences sexuelles accompagnées",
  },
  {
    id: "IND-002",
    chantier_id: "CH-002",
    nom: "Nombre de téléphones grave danger attribués",
  },
  {
    id: "IND-003",
    chantier_id: "CH-003",
    nom: "Écart de rémunération entre les femmes et les hommes",
  },
  {
    id: "IND-004",
    chantier_id: "CH-004",
    nom: "Nombre de maisons de santé pluriprofessionnelles",
  },
  {
    id: "IND-005",
    chantier_id: "CH-005",
    nom: "Délai médian de passage aux urgences",
  },
  {
    id: "IND-006",
    chantier_id: "CH-006",
    nom: "Taux de couverture vaccinale contre la grippe des plus de 65 ans",
  },
  {
    id: "IND-007",
    chantier_id: "CH-007",
    nom: "Nombre de rénovations énergétiques de logements financées",
  },
  {
    id: "IND-008",
    chantier_id: "CH-008",
    nom: "Nombre de logements indignes traités",
  },
  {
    id: "IND-009",
    chantier_id: "CH-009",
    nom: "Nombre de logements sociaux agréés",
  },
  {
    id: "IND-010",
    chantier_id: "CH-010",
    nom: "Part des établissements recevant du public accessibles",
  },
  {
    id: "IND-011",
    chantier_id: "CH-011",
    nom: "Taux d'emploi des personnes en situation de handicap",
  },
  {
    id: "IND-012",
    chantier_id: "CH-012",
    nom: "Nombre de contrats d'apprentissage signés",
  },
  {
    id: "IND-013",
    chantier_id: "CH-013",
    nom: "Nombre de demandeurs d'emploi de longue durée accompagnés",
  },
  {
    id: "IND-014",
    chantier_id: "CH-014",
    nom: "Nombre de personnes tuées sur les routes",
  },
  {
    id: "IND-015",
    chantier_id: "CH-015",
    nom: "Puissance installée d'énergies renouvelables",
  },
  {
    id: "IND-016",
    chantier_id: "CH-016",
    nom: "Émissions de CO₂ du secteur des transports",
  },
  {
    id: "IND-017",
    chantier_id: "CH-017",
    nom: "Nombre de classes dédoublées en éducation prioritaire",
  },
  {
    id: "IND-018",
    chantier_id: "CH-018",
    nom: "Part des élèves maîtrisant les fondamentaux en mathématiques en fin de CM2",
  },
  {
    id: "IND-894",
    chantier_id: "CH-018",
    nom: "Part des élèves lisant couramment en fin de CE1",
  },
  {
    id: "IND-019",
    chantier_id: "CH-019",
    nom: "Part des locaux raccordables à la fibre",
  },
  {
    id: "IND-020",
    chantier_id: "CH-020",
    nom: "Nombre de personnes accompagnées par un conseiller numérique",
  },
];

/**
 * L'indicateur d'un chantier dans le monde de base, pour y rattacher des
 * valeurs territoriales.
 */
export function indicateurDuChantier(chantierId: string) {
  return `IND-${chantierId.slice(3)}`;
}

/**
 * Chantiers dotés de données rattachées. Les tools de détail (indicateurs,
 * commentaires, objectifs) renverraient sinon du vide, ce qui pousse l'agent à
 * enchaîner d'autres appels et brouille la mesure de sélection d'outils.
 */
const DETAILED_CHANTIERS = ["CH-001", "CH-004", "CH-007"];

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

async function seedDetailedChantier({
  chantierId,
  authorId,
}: {
  chantierId: string;
  authorId: string;
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

  await fixtures.indicateurTerritoire({
    id: indicateurDuChantier(chantierId),
    chantier_id: chantierId,
    territoire_code: NATIONAL_TERRITORY,
  });

  // `freins_a_lever` et non `autres_resultats_obtenus` : ce dernier est un type
  // TERRITORIAL, que `getTypesContenuChantierPourTerritoire` exclut dès que le
  // territoire interrogé est NAT-FR. Un commentaire semé ainsi au national est
  // invisible pour l'outil — sans erreur, l'agent répond juste « aucun
  // commentaire », et le scorer de sélection d'outils reste vert.
  await fixtures.commentaire({
    chantier_id: chantierId,
    territoire_code: NATIONAL_TERRITORY,
    maille: "NAT",
    code_insee: "FR",
    type: "freins_a_lever",
    contenu: `Frein identifié sur le ${chantierId} : délais de recrutement.`,
    auteur_creation_id: authorId,
    auteur_modification_id: authorId,
  });

  await fixtures.objectifChantier({
    chantier_id: chantierId,
    type: "notre_ambition",
    contenu: `Objectif principal du ${chantierId}.`,
    auteur_creation_id: authorId,
    auteur_modification_id: authorId,
  });
}

/**
 * L'utilisateur n'est pas décoratif : `llm_calls.utilisateur_id` porte une clé
 * étrangère, et l'assistant y écrit à chaque tour comme en production.
 */
export async function seedEvalWorld(): Promise<EvalWorld> {
  const user = await fixtures.utilisateur({});

  for (const chantier of CHANTIERS) {
    await fixtures.chantierIdentite(chantier);
  }

  for (const indicateur of INDICATEURS) {
    await fixtures.indicateurIdentite(indicateur);
  }

  for (const chantierId of DETAILED_CHANTIERS) {
    await seedDetailedChantier({ chantierId, authorId: user.id });
  }

  const chantiersAccessibles = CHANTIERS.map((chantier) => chantier.id);

  // Les territoires ne sont pas semés : le référentiel est chargé dans la base
  // de test par `prisma db seed` (`pnpm test:database:init`). On prend donc le
  // référentiel réel — sinon une question sur la Bretagne porterait sur un
  // territoire inexistant, et l'agent aurait raison de ne pas appeler l'outil.
  const territoires = await getPrisma().territoire.findMany();
  const territoiresAccessibles = territoires.map(
    (territoire) => territoire.code,
  );

  const fullPerimetre = {
    chantiers: chantiersAccessibles,
    territoires: territoiresAccessibles,
    périmètres: [],
  };

  return {
    userId: user.id,
    chantiers: CHANTIERS,
    habilitations: {
      lecture: fullPerimetre,
      saisieCommentaire: fullPerimetre,
      saisieIndicateur: fullPerimetre,
      responsabilite: fullPerimetre,
      gestionUtilisateur: fullPerimetre,
    },
  };
}
