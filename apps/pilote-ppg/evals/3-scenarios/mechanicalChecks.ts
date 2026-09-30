/**
 * Les règles de forme du prompt système, vérifiées sans LLM. Un juge y serait
 * moins fiable qu'une regex, et ses oscillations brouilleraient la lecture
 * des critères de fond.
 *
 * Chaque vérification tolère ce qui ne change rien pour l'utilisateur : un
 * titre de gabarit à un autre niveau, une casse ou un accent différent, un
 * tiret court à la place du tiret cadratin.
 */

export type CheckResult = { ok: boolean; detail: string };

/**
 * Ramène la typographie d'Albert à l'ASCII usuel : tous les tirets (U+2010
 * à U+2015, dont l'insécable, le demi-cadratin et le cadratin, et le signe
 * moins U+2212) deviennent un trait d'union, les apostrophes courbes
 * (U+2018, U+2019, U+02BC) une apostrophe, les espaces insécables (U+00A0,
 * U+202F) une espace. « CH‑005 », « CH–005 » et « CH-005 » sont ainsi le
 * même code, et « Synthèse – chantiers » la même mention que « Synthèse —
 * chantiers ».
 */
export function typographie(text: string): string {
  return text
    .replace(/[‐-―−]/g, "-")
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[  ]/g, " ");
}

export function normalize(text: string): string {
  return typographie(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function unique(values: string[]) {
  return [...new Set(values)];
}

const TOOL_NAME = /\b(?:get|search|create|export|display|compose)_[a-z_]+\b/g;

export function checkNoToolName({ text }: { text: string }): CheckResult {
  const cites = unique(text.match(TOOL_NAME) ?? []);
  return cites.length === 0
    ? { ok: true, detail: "aucun nom d'outil" }
    : { ok: false, detail: `noms d'outils cités : ${cites.join(", ")}` };
}

const METEO_CODE =
  /\b(?:SOLEIL|COUVERT|NUAGE|ORAGE|NON_RENSEIGNEE|NON_NECESSAIRE)\b/g;

export function checkNoMeteoCode({ text }: { text: string }): CheckResult {
  const cites = unique(text.match(METEO_CODE) ?? []);
  return cites.length === 0
    ? { ok: true, detail: "libellés météo uniquement" }
    : { ok: false, detail: `codes météo cités : ${cites.join(", ")}` };
}

// CH-XXX exige trois chiffres et le tiret ; REG-XX et DEPT-XX le tiret.
const MALFORMED_CODE =
  /\bCH-\d{1,2}\b|\bCH\s?\d{2,4}\b|\bREG\s?\d{2}\b|\bDEPT\s?\d{2}\b/g;

export function checkOfficialCodes({ text }: { text: string }): CheckResult {
  const malformes = unique(typographie(text).match(MALFORMED_CODE) ?? []);
  return malformes.length === 0
    ? { ok: true, detail: "codes officiels" }
    : { ok: false, detail: `codes mal formés : ${malformes.join(", ")}` };
}

export function checkHeadings({
  text,
  titles,
}: {
  text: string;
  titles: string[];
}): CheckResult {
  const headings = [...text.matchAll(/^\s{0,3}#{1,6}\s+(.+)$/gm)].map((match) =>
    normalize(match[1].replace(/[*_]/g, "")),
  );
  const manquants = titles.filter(
    (title) => !headings.some((heading) => heading.includes(normalize(title))),
  );
  return manquants.length === 0
    ? { ok: true, detail: "titres du gabarit présents" }
    : { ok: false, detail: `titres manquants : ${manquants.join(", ")}` };
}

export function checkContains({
  text,
  fragments,
}: {
  text: string;
  fragments: string[];
}): CheckResult {
  const normalized = normalize(text);
  const manquants = fragments.filter(
    (fragment) => !normalized.includes(normalize(fragment)),
  );
  return manquants.length === 0
    ? { ok: true, detail: "mentions présentes" }
    : { ok: false, detail: `mentions absentes : ${manquants.join(", ")}` };
}

export function checkChantiersCited({
  text,
  chantiers,
}: {
  text: string;
  chantiers: { id: string; nom: string }[];
}): CheckResult {
  const plain = normalize(text.replace(/[*_]/g, ""));
  const absents = chantiers
    .filter(
      (chantier) =>
        !new RegExp(
          `${escapeRegExp(normalize(chantier.id))}\\s*[—–-]\\s*${escapeRegExp(normalize(chantier.nom))}`,
        ).test(plain),
    )
    .map((chantier) => chantier.id);
  return absents.length === 0
    ? { ok: true, detail: "chaque chantier au format CH-XXX — Nom" }
    : {
        ok: false,
        detail: `chantiers absents du format CH-XXX — Nom : ${absents.join(", ")}`,
      };
}

/**
 * Neuf mots d'affilée repris d'un commentaire : au-delà d'une expression
 * figée (« le délai médian de passage »), c'est une phrase recopiée.
 * Calibration du 30/09 : le juge ne voyait pas la recopie (0/3), d'où cette
 * vérification mécanique.
 */
const FENETRE_RECOPIE = 9;

function mots(text: string) {
  return normalize(text.replace(/<[^>]+>/g, " "))
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function checkNoVerbatim({
  text,
  sources,
}: {
  text: string;
  sources: string[];
}): CheckResult {
  const texte = ` ${mots(text).join(" ")} `;

  for (const source of sources) {
    const motsSource = mots(source);
    for (
      let debut = 0;
      debut + FENETRE_RECOPIE <= motsSource.length;
      debut += 1
    ) {
      const passage = motsSource
        .slice(debut, debut + FENETRE_RECOPIE)
        .join(" ");
      if (texte.includes(` ${passage} `)) {
        return { ok: false, detail: `passage recopié : « ${passage} »` };
      }
    }
  }

  return { ok: true, detail: "aucun passage recopié" };
}

const PHRASES_MAX = 2;

function compterPhrases(text: string) {
  return text.split(/[.!?…](?:\s+|$)/).filter((phrase) => phrase.trim()).length;
}

/**
 * Les gabarits placent le résumé d'un commentaire dans une citation
 * markdown (`> …`) sous chaque chantier. Compter ses phrases est mécanique :
 * la calibration du 30/09 a montré que le juge comptait mal (0/3 sur un
 * résumé de cinq phrases).
 */
export function checkResumesCourts({ text }: { text: string }): CheckResult {
  const tropLongs = text
    .split("\n")
    .filter((line) => /^\s*>/.test(line))
    .map((line) => line.replace(/^\s*>\s?/, "").trim())
    .filter((resume) => compterPhrases(resume) > PHRASES_MAX);

  return tropLongs.length === 0
    ? { ok: true, detail: "résumés d'une ou deux phrases" }
    : {
        ok: false,
        detail: `résumé de ${compterPhrases(tropLongs[0])} phrases : « ${tropLongs[0]} »`,
      };
}

const MENTION_ABSENCE = "pas de commentaire disponible";

/**
 * La mention doit figurer SOUS chaque chantier sans commentaire : entre sa
 * citation et celle du chantier suivant. Présente ailleurs dans la réponse,
 * elle ne dit rien de ce chantier-là.
 */
export function checkAbsenceSignalee({
  text,
  chantierIds,
}: {
  text: string;
  chantierIds: string[];
}): CheckResult {
  const texte = typographie(text);
  const citations = [...texte.matchAll(/CH-\d{3}/g)].map((match) => ({
    id: match[0],
    index: match.index ?? 0,
  }));

  const sansMention = chantierIds.filter((chantierId) => {
    const sections = citations
      .map((citation, position) => ({ citation, position }))
      .filter(({ citation }) => citation.id === chantierId)
      .map(({ citation, position }) => {
        const suivante = citations
          .slice(position + 1)
          .find((autre) => autre.id !== chantierId);
        return texte.slice(citation.index, suivante?.index ?? texte.length);
      });
    return !sections.some((section) =>
      normalize(section).includes(MENTION_ABSENCE),
    );
  });

  return sansMention.length === 0
    ? { ok: true, detail: "absence de commentaire signalée" }
    : {
        ok: false,
        detail: `« Pas de commentaire disponible » absent sous : ${sansMention.join(", ")}`,
      };
}

function tableRows(text: string) {
  return typographie(text)
    .split("\n")
    .filter((line) => /^\s*\|.*\|\s*$/.test(line));
}

export function checkHasTable({ text }: { text: string }): CheckResult {
  return tableRows(text).length >= 2
    ? { ok: true, detail: "tableau présent" }
    : { ok: false, detail: "aucun tableau markdown" };
}

export function checkNoChantierTable({ text }: { text: string }): CheckResult {
  const lignesChantier = tableRows(text).filter((row) =>
    /\bCH-\d{3}\b/.test(row),
  );
  return lignesChantier.length === 0
    ? { ok: true, detail: "pas de tableau de chantiers" }
    : {
        ok: false,
        detail: `${lignesChantier.length} ligne(s) de chantier en tableau`,
      };
}

export function checkTableTerritories({
  text,
  noms,
}: {
  text: string;
  noms: string[];
}): CheckResult {
  const rows = tableRows(text).map(normalize);
  const absents = noms.filter(
    (nom) => !rows.some((row) => row.includes(normalize(nom))),
  );
  return absents.length === 0
    ? { ok: true, detail: "tous les territoires dans le tableau" }
    : {
        ok: false,
        detail: `territoires absents du tableau : ${absents.join(", ")}`,
      };
}

// Même motif que la validation des titres de widget de `composeDashboard.ts`.
const FIGURE = /\d{1,10}\s{0,5}(?:%|points?\b|pts\b)/i;

export function checkNoFigure({ text }: { text: string }): CheckResult {
  const match = FIGURE.exec(text);
  return match
    ? { ok: false, detail: `valeur chiffrée : « ${match[0]} »` }
    : { ok: true, detail: "aucune valeur chiffrée" };
}

export function checkNoLink({ text }: { text: string }): CheckResult {
  const match = /https?:\/\/\S+/.exec(text);
  return match
    ? { ok: false, detail: `lien donné : ${match[0]}` }
    : { ok: true, detail: "aucun lien" };
}

export function checkExactAnswer({
  text,
  expected,
}: {
  text: string;
  expected: string;
}): CheckResult {
  const sansPonctuationFinale = (valeur: string) =>
    normalize(valeur).replace(/[.!…\s]+$/, "");
  return sansPonctuationFinale(text) === sansPonctuationFinale(expected)
    ? { ok: true, detail: "réponse attendue" }
    : { ok: false, detail: `réponse : « ${text.trim().slice(0, 120)} »` };
}

type DashboardContainer = { widgets: { type: string }[] };

/**
 * Une section de tableau de bord commence à un `widget_titre_section` et
 * court jusqu'au suivant : un conteneur n'est qu'une ligne de la grille.
 * Run du 30/09 : Albert place le titre, les indicateurs clés et la
 * cartographie dans trois conteneurs d'une même section. Sans titre de
 * section, chaque conteneur en est une.
 */
function sectionsDuDashboard(containers: DashboardContainer[]) {
  const aDesTitres = containers.some(
    (container) => container.widgets[0]?.type === "widget_titre_section",
  );
  if (!aDesTitres) return containers.map((container) => container.widgets);

  return containers.reduce<{ type: string }[][]>((sections, container) => {
    if (
      sections.length === 0 ||
      container.widgets[0]?.type === "widget_titre_section"
    ) {
      return [...sections, [...container.widgets]];
    }
    sections[sections.length - 1].push(...container.widgets);
    return sections;
  }, []);
}

export function checkSectionsDashboard({
  containers,
  chantierIds,
}: {
  containers: DashboardContainer[];
  chantierIds: string[];
}): CheckResult {
  const chantiersParSection = sectionsDuDashboard(containers).map((widgets) => [
    ...new Set(
      widgets
        .filter((widget) => "chantier_id" in widget)
        .map((widget) => (widget as { chantier_id: string }).chantier_id),
    ),
  ]);

  const [premiere = [], ...suivantes] = chantiersParSection;
  if (premiere.length > 0) {
    return { ok: false, detail: "la première section porte sur un chantier" };
  }

  const attendus = [...chantierIds].sort();
  const obtenus = suivantes
    .filter((ids) => ids.length > 0)
    .map((ids) => ids.join("+"))
    .sort();

  return JSON.stringify(obtenus) === JSON.stringify(attendus)
    ? { ok: true, detail: `une section par chantier : ${attendus.join(", ")}` }
    : {
        ok: false,
        detail: `sections chantier : ${obtenus.join(", ") || "aucune"}, attendu ${attendus.join(", ")}`,
      };
}
