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

export function normalize(text: string): string {
  return text
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
  const malformes = unique(text.match(MALFORMED_CODE) ?? []);
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

function tableRows(text: string) {
  return text.split("\n").filter((line) => /^\s*\|.*\|\s*$/.test(line));
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
  return normalize(text) === normalize(expected)
    ? { ok: true, detail: "réponse attendue" }
    : { ok: false, detail: `réponse : « ${text.trim().slice(0, 120)} »` };
}
