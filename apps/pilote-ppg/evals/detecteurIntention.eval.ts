import { createScorer, evalite } from "evalite";
import {
  type Capacities,
  detecterCapacities,
} from "@/server/albert/detecteurIntention";

/**
 * SPIKE — volet 1/3 : eval purement deterministe.
 *
 * Aucun appel reseau, aucune base : `detecterCapacities` n'est que du matching
 * de mots-cles. L'interet de le passer en eval plutot qu'en test unitaire est le
 * score partiel — les 4 capacities sont notees separement, donc une regression
 * qui n'en casse qu'une se voit comme 0,75 et non comme un echec opaque.
 */

type CasIntention = {
  message: string;
  /** Note libre sur ce que le cas cherche a verifier. */
  motif: string;
};

const CAS: { input: CasIntention; expected: Capacities }[] = [
  {
    input: {
      message: "Fais-moi une synthèse de l'avancement du chantier CH-042",
      motif: "synthèse explicite, rien d'autre",
    },
    expected: {
      synthese: true,
      dashboard: false,
      exportRapport: false,
      inclureSousTerritoires: false,
    },
  },
  {
    input: {
      message: "Affiche un tableau de bord des indicateurs de la région Bretagne",
      motif: "dashboard explicite",
    },
    expected: {
      synthese: false,
      dashboard: true,
      exportRapport: false,
      inclureSousTerritoires: false,
    },
  },
  {
    input: {
      message: "Exporte-moi ça en PDF",
      motif: "export seul",
    },
    expected: {
      synthese: false,
      dashboard: false,
      exportRapport: true,
      inclureSousTerritoires: false,
    },
  },
  {
    input: {
      message:
        "Donne-moi l'état des lieux de la Normandie et ses départements, en PDF",
      motif: "les trois intentions cumulées + sous-territoires",
    },
    expected: {
      synthese: true,
      dashboard: false,
      exportRapport: true,
      inclureSousTerritoires: true,
    },
  },
  {
    input: {
      message: "Combien de chantiers sont en retard ?",
      motif: "question factuelle : aucune capacity ne doit s'activer",
    },
    expected: {
      synthese: false,
      dashboard: false,
      exportRapport: false,
      inclureSousTerritoires: false,
    },
  },
  {
    input: {
      message: "Quel est le taux d'avancement du chantier CH-007 ?",
      motif: "question factuelle sur un chantier précis",
    },
    expected: {
      synthese: false,
      dashboard: false,
      exportRapport: false,
      inclureSousTerritoires: false,
    },
  },
  {
    input: {
      message: "Résume-moi la situation",
      motif: "synthèse par 'résume', sans accent sur la forme conjuguée",
    },
    expected: {
      synthese: true,
      dashboard: false,
      exportRapport: false,
      inclureSousTerritoires: false,
    },
  },
  {
    input: {
      message: "Donne-moi une vue d'ensemble du PPG",
      motif:
        "PIEGE : 'vue d'ensemble' est une synthèse, mais 'vue' est aussi un mot-clé dashboard",
    },
    expected: {
      synthese: true,
      dashboard: false,
      exportRapport: false,
      inclureSousTerritoires: false,
    },
  },
];

const CLES: (keyof Capacities)[] = [
  "synthese",
  "dashboard",
  "exportRapport",
  "inclureSousTerritoires",
];

/**
 * Note la proportion de capacities correctement detectees (0 a 1) et remonte le
 * detail des ecarts en metadata, lisible dans l'UI d'Evalite.
 */
const capacitiesExactes = createScorer<CasIntention, Capacities, Capacities>({
  name: "Capacities exactes",
  description:
    "Proportion des 4 capacities correctement detectees, avec le detail des ecarts.",
  scorer: ({ output, expected }) => {
    if (!expected) return 0;

    const ecarts = CLES.filter((cle) => output[cle] !== expected[cle]).map(
      (cle) => `${cle}: attendu ${expected[cle]}, obtenu ${output[cle]}`,
    );

    return {
      score: (CLES.length - ecarts.length) / CLES.length,
      metadata: ecarts.length === 0 ? "conforme" : ecarts.join(" | "),
    };
  },
});

evalite<CasIntention, Capacities, Capacities>("Détecteur d'intention", {
  data: () => CAS,
  task: (input) => detecterCapacities(input.message),
  scorers: [capacitiesExactes],
  columns: ({ input, output, expected }) => [
    { label: "Motif", value: input.motif },
    {
      label: "Détecté",
      value: CLES.filter((cle) => output[cle]).join(", ") || "—",
    },
    {
      label: "Attendu",
      value: CLES.filter((cle) => expected?.[cle]).join(", ") || "—",
    },
  ],
});
