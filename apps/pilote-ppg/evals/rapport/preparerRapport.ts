import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Prépare les données de la page publique des evals à partir du JSON écrit par
 * `evalite run --outputPath`.
 *
 * Le JSON d'Evalite est fait pour être relu par Evalite : chemins absolus de la
 * machine qui a lancé le run, traces LLM complètes (plusieurs dizaines de Mo),
 * un enregistrement par essai sans index d'essai. La page publique n'a besoin
 * que des cas, de leurs essais et de leurs scores.
 *
 * Chaque run s'ajoute à l'historique publié avec la page, pour comparer un
 * run au précédent.
 *
 *   pnpm eval:rapport <resultats-evalite.json> [--commit <sha>] [--historique <historique.json>]
 */

type EvaliteColumn = { label: string; value: unknown };

type EvaliteScore = {
  name: string;
  score: number;
  description?: string | null;
  metadata?: unknown;
};

type EvaliteEval = {
  duration: number;
  input: unknown;
  output: unknown;
  status: string;
  colOrder: number;
  renderedColumns?: unknown;
  averageScore: number;
  scores: EvaliteScore[];
};

type EvaliteSuite = {
  name: string;
  filepath: string;
  status: string;
  averageScore: number;
  evals: EvaliteEval[];
};

export type EvaliteResults = {
  run: { id: number; createdAt: string };
  suites: EvaliteSuite[];
};

export type Colonne = { libelle: string; valeur: string };

export type Nature = "mecanique" | "juge" | null;

export type ScoreRapport = {
  nom: string;
  score: number;
  nature: Nature;
  regle: string;
  detail: string;
};

export type EssaiRapport = {
  statut: string;
  duree: number;
  score: number;
  colonnes: Colonne[];
  scores: ScoreRapport[];
};

export type CasRapport = {
  titre: string;
  score: number;
  colonnes: Colonne[];
  essais: EssaiRapport[];
};

export type SuiteRapport = {
  id: string;
  niveau: string;
  groupe: string;
  titre: string;
  fichier: string;
  statut: string;
  score: number;
  cas: CasRapport[];
};

/**
 * Score moyen des suites, par niveau. La calibration (3.0) mesure le juge et
 * non l'assistant : elle a son propre score et n'entre pas dans le global.
 */
export type Resume = { score: number; niveaux: Record<string, number> };

export type Rapport = {
  run: { id: number; date: string; commit: string | null };
  resume: Resume;
  suites: SuiteRapport[];
};

export type EntreeHistorique = {
  date: string;
  commit: string | null;
} & Resume;

const parseJson = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

const enTexte = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
};

const moyenne = (valeurs: number[]): number =>
  valeurs.length === 0
    ? 0
    : valeurs.reduce((total, valeur) => total + valeur, 0) / valeurs.length;

const slug = (texte: string): string =>
  texte
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036F]/g, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");

/**
 * « 2.1 · Recherche · search_chantiers » → niveau, groupe, titre.
 * « 1 · Outils chargés » → niveau et titre : le niveau 1 n'a pas de groupe.
 */
const decouperNom = ({ nom }: { nom: string }) => {
  const [niveau = "", ...reste] = nom.split(" · ");
  if (reste.length === 0) return { niveau: "", groupe: "", titre: nom };
  if (reste.length === 1) return { niveau, groupe: "", titre: reste[0] ?? "" };
  const [groupe = "", ...titre] = reste;
  return { niveau, groupe, titre: titre.join(" · ") };
};

/** Les descriptions des grilles commencent par « Mécanique — » ou « Jugé — ». */
const lireRegle = ({
  description,
}: {
  description: string;
}): { nature: Nature; regle: string } => {
  const [prefixe, ...reste] = description.split(" — ");
  if (reste.length > 0 && prefixe === "Mécanique") {
    return { nature: "mecanique", regle: reste.join(" — ") };
  }
  if (reste.length > 0 && prefixe === "Jugé") {
    return { nature: "juge", regle: reste.join(" — ") };
  }
  return { nature: null, regle: description };
};

const lireDetail = ({ metadata }: { metadata: unknown }): string => {
  const valeur = parseJson(metadata);
  if (
    typeof valeur === "object" &&
    valeur !== null &&
    "verdict" in valeur &&
    typeof valeur.verdict === "string"
  ) {
    return valeur.verdict;
  }
  return enTexte(valeur);
};

const lireColonnes = ({ evaluation }: { evaluation: EvaliteEval }) => {
  const colonnes = parseJson(evaluation.renderedColumns);
  if (!Array.isArray(colonnes)) return [];

  const output = parseJson(evaluation.output);
  const reponseComplete =
    typeof output === "object" &&
    output !== null &&
    "text" in output &&
    typeof output.text === "string"
      ? output.text
      : null;

  return (colonnes as EvaliteColumn[]).map(({ label, value }) => ({
    libelle: label,
    // Les colonnes de niveau 2 tronquent la réponse pour le tableau d'Evalite.
    valeur:
      label === "Réponse" && reponseComplete !== null
        ? reponseComplete
        : enTexte(value),
  }));
};

const LIBELLES_TITRE = ["Message", "Question"];

const preparerCas = ({ essais }: { essais: EvaliteEval[] }): CasRapport => {
  const colonnesParEssai = essais.map((evaluation) =>
    lireColonnes({ evaluation }),
  );
  const [premieres = []] = colonnesParEssai;

  // Une colonne identique sur tous les essais décrit le cas (message, motif) ;
  // les autres décrivent ce que l'agent a fait à cet essai-là.
  const communes = premieres.filter((colonne) =>
    colonnesParEssai.every((colonnes) =>
      colonnes.some(
        ({ libelle, valeur }) =>
          libelle === colonne.libelle && valeur === colonne.valeur,
      ),
    ),
  );
  const estCommune = (colonne: Colonne) =>
    communes.some(({ libelle }) => libelle === colonne.libelle);

  const colonneTitre =
    communes.find(({ libelle }) => LIBELLES_TITRE.includes(libelle)) ??
    communes[0];

  return {
    titre: colonneTitre?.valeur ?? enTexte(parseJson(essais[0]?.input)),
    score: moyenne(essais.map(({ averageScore }) => averageScore)),
    colonnes: communes,
    essais: essais.map((evaluation, index) => ({
      statut: evaluation.status,
      duree: evaluation.duration,
      score: evaluation.averageScore,
      colonnes: (colonnesParEssai[index] ?? []).filter(
        (colonne) => !estCommune(colonne),
      ),
      scores: evaluation.scores.map(
        ({ name, score, description, metadata }) => ({
          nom: name,
          score,
          ...lireRegle({ description: description ?? "" }),
          detail: lireDetail({ metadata }),
        }),
      ),
    })),
  };
};

/**
 * Evalite écrit un enregistrement par essai, sans index d'essai : les essais
 * d'un même cas partagent le même input.
 */
const regrouperEssais = ({ evals }: { evals: EvaliteEval[] }) => {
  const groupes = new Map<string, EvaliteEval[]>();
  for (const evaluation of [...evals].sort((a, b) => a.colOrder - b.colOrder)) {
    const cle = JSON.stringify(parseJson(evaluation.input));
    groupes.set(cle, [...(groupes.get(cle) ?? []), evaluation]);
  }
  return [...groupes.values()];
};

const cheminRelatif = ({ filepath }: { filepath: string }) => {
  const index = filepath.lastIndexOf("/evals/");
  return index === -1 ? path.basename(filepath) : filepath.slice(index + 1);
};

const NIVEAU_CALIBRATION = "juge";

const cleNiveau = ({ niveau }: { niveau: string }) =>
  niveau.startsWith("3.0") ? NIVEAU_CALIBRATION : (niveau.split(".")[0] ?? "");

const resumer = ({ suites }: { suites: SuiteRapport[] }): Resume => {
  const scoresParNiveau = suites.reduce<Record<string, number[]>>(
    (groupes, suite) => {
      const cle = cleNiveau(suite);
      return { ...groupes, [cle]: [...(groupes[cle] ?? []), suite.score] };
    },
    {},
  );
  return {
    score: moyenne(
      suites
        .filter((suite) => cleNiveau(suite) !== NIVEAU_CALIBRATION)
        .map(({ score }) => score),
    ),
    niveaux: Object.fromEntries(
      Object.entries(scoresParNiveau).map(([cle, scores]) => [
        cle,
        moyenne(scores),
      ]),
    ),
  };
};

export const ajouterAHistorique = ({
  historique,
  rapport,
}: {
  historique: EntreeHistorique[];
  rapport: Rapport;
}): EntreeHistorique[] => [
  ...historique,
  { date: rapport.run.date, commit: rapport.run.commit, ...rapport.resume },
];

const preparerSuites = ({ resultats }: { resultats: EvaliteResults }) =>
  resultats.suites
    .map((suite) => {
      const fichier = cheminRelatif({ filepath: suite.filepath });
      return {
        id: slug(suite.name),
        ...decouperNom({ nom: suite.name }),
        fichier,
        statut: suite.status,
        score: suite.averageScore,
        cas: regrouperEssais({ evals: suite.evals }).map((essais) =>
          preparerCas({ essais }),
        ),
      };
    })
    .sort((a, b) =>
      a.niveau === b.niveau
        ? a.titre.localeCompare(b.titre, "fr")
        : a.niveau.localeCompare(b.niveau, "fr", { numeric: true }),
    );

export const preparerRapport = ({
  resultats,
  commit,
}: {
  resultats: EvaliteResults;
  commit: string | null;
}): Rapport => {
  const suites = preparerSuites({ resultats });
  // Un run qui plante au chargement des suites laisse un JSON sans aucun cas :
  // le publier remplacerait la page par un rapport vide, noté 0 %.
  if (suites.every(({ cas }) => cas.length === 0)) {
    throw new Error(
      "Aucun cas dans les résultats d'Evalite : le run a échoué, rien à publier.",
    );
  }
  return {
    run: { id: resultats.run.id, date: resultats.run.createdAt, commit },
    resume: resumer({ suites }),
    suites,
  };
};

const lireOption = ({ argv, nom }: { argv: string[]; nom: string }) => {
  const index = argv.indexOf(nom);
  return index === -1 ? null : (argv[index + 1] ?? null);
};

const lireHistorique = ({ chemin }: { chemin: string | null }) =>
  chemin !== null && existsSync(chemin)
    ? (JSON.parse(readFileSync(chemin, "utf8")) as EntreeHistorique[])
    : [];

const ecrireDonnees = ({
  fichier,
  contenu,
}: {
  fichier: string;
  contenu: unknown;
}) => {
  const destination = path.join(import.meta.dirname, "site", "data", fichier);
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, JSON.stringify(contenu));
  return destination;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const [source, ...options] = process.argv.slice(2);
  if (!source) {
    throw new Error(
      "Usage : pnpm eval:rapport <resultats-evalite.json> [--commit <sha>] [--historique <historique.json>]",
    );
  }

  const resultats = JSON.parse(readFileSync(source, "utf8")) as EvaliteResults;
  const rapport = preparerRapport({
    resultats,
    commit: lireOption({ argv: options, nom: "--commit" }),
  });
  const historique = ajouterAHistorique({
    historique: lireHistorique({
      chemin: lireOption({ argv: options, nom: "--historique" }),
    }),
    rapport,
  });

  const destination = ecrireDonnees({
    fichier: "rapport.json",
    contenu: rapport,
  });
  ecrireDonnees({ fichier: "historique.json", contenu: historique });
  // eslint-disable-next-line no-console
  console.log(
    `${rapport.suites.length} suites, ${rapport.suites.reduce((total, { cas }) => total + cas.length, 0)} cas, ${historique.length} runs dans l'historique → ${path.dirname(destination)}`,
  );
}
