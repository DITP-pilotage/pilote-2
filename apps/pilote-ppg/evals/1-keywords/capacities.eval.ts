import { createScorer, evalite } from "evalite";
import {
  type Capacities,
  detecterCapacities,
} from "@/server/albert/detecteurIntention";

/**
 * Niveau 1 — détection d'intention par mots-clés.
 *
 * `detecterCapacities` conditionne l'exposition de `create_dashboard` et
 * `export_rapport` : une capacity non détectée retire l'outil du ToolSet, donc
 * l'agent ne PEUT pas l'appeler. Un faux négatif ici plafonne le niveau 2.
 *
 * Aucun LLM, aucune base. L'intérêt de le passer en eval plutôt qu'en test
 * unitaire est le score partiel : les quatre capacities sont notées séparément,
 * donc une régression qui n'en casse qu'une se lit comme 0,75 et non comme un
 * échec opaque.
 *
 * Référence observée le 2026-09-10 : 96 % sur 6 cas, en 400 ms.
 *
 * Un seul cas sous la barre, à 75 % : « Donne-moi une vue d'ensemble de la
 * situation » active `dashboard` en plus de `synthese`. « vue » figure dans les
 * mots-clés dashboard et « vue d'ensemble » dans ceux de synthèse ; le premier
 * match l'emporte. Conséquence réelle : `create_dashboard` est exposé sur une
 * demande de synthèse. C'est un constat sur le détecteur, pas un cas à corriger.
 */

type KeywordCase = {
  message: string;
  reason: string;
};

const CASES: { input: KeywordCase; expected: Capacities }[] = [
  {
    input: {
      message: "Fais-moi une synthèse de l'avancement du chantier CH-004",
      reason: "synthèse explicite, rien d'autre",
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
      message: "Affiche un tableau de bord des indicateurs de la Bretagne",
      reason: "dashboard explicite",
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
      message: "Exporte-moi un rapport Markdown sur la Bretagne",
      reason: "export explicite",
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
      message: "Fais la synthèse de la Bretagne et ses departements",
      reason: "synthèse + sous-territoires",
    },
    expected: {
      synthese: true,
      dashboard: false,
      exportRapport: false,
      inclureSousTerritoires: true,
    },
  },
  {
    input: {
      message: "Quel est le taux d'avancement de la Bretagne ?",
      reason: "question factuelle : aucune capacity ne doit s'activer",
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
      message: "Donne-moi une vue d'ensemble de la situation",
      reason:
        "PIÈGE : « vue d'ensemble » est une synthèse, mais « vue » est aussi un mot-clé dashboard",
    },
    expected: {
      synthese: true,
      dashboard: false,
      exportRapport: false,
      inclureSousTerritoires: false,
    },
  },
];

const capacityScorer = createScorer<KeywordCase, Capacities, Capacities>({
  name: "Capacities",
  description: "Une note par capacity, moyenne sur les quatre.",
  scorer: ({ output, expected }) => {
    const cles = Object.keys(output) as (keyof Capacities)[];
    const fausses = cles.filter((cle) => output[cle] !== expected?.[cle]);

    return {
      score: (cles.length - fausses.length) / cles.length,
      metadata:
        fausses.length === 0
          ? "les quatre capacities sont correctes"
          : `incorrectes : ${fausses.join(", ")}`,
    };
  },
});

const listerActives = (capacities: Capacities | undefined) =>
  Object.entries(capacities ?? {})
    .filter(([, actif]) => actif)
    .map(([nom]) => nom)
    .join(", ") || "—";

evalite<KeywordCase, Capacities, Capacities>("Détection par mots-clés", {
  data: () => CASES,
  task: (input) => Promise.resolve(detecterCapacities(input.message)),
  scorers: [capacityScorer],
  columns: ({ input, output, expected }) => [
    { label: "Motif", value: input.reason },
    { label: "Détecté", value: listerActives(output) },
    { label: "Attendu", value: listerActives(expected) },
  ],
});
