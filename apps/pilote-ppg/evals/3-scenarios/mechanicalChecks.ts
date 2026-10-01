/**
 * Les règles de forme du prompt système, vérifiées sans LLM. Un juge y serait
 * moins fiable qu'une regex, et ses oscillations brouilleraient la lecture
 * des critères de fond.
 *
 * Chaque vérification tolère ce qui ne change rien pour l'utilisateur : une
 * casse ou un accent différent, un tiret court à la place du tiret cadratin.
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

/**
 * Le format CH-XXX — Nom, pour tout chantier cité : il suffit qu'une
 * mention porte le nom, les suivantes peuvent s'en tenir au code. Le nom
 * exact des chantiers attendus relève de `checkChantiersCited`.
 */
export function checkChantierFormat({ text }: { text: string }): CheckResult {
  const plain = typographie(text.replace(/[*_]/g, ""));
  const codes = unique(plain.match(/\bCH-\d{3}\b/g) ?? []);
  const sansNom = codes.filter(
    (code) => !new RegExp(`\\b${code}\\s*-\\s*\\p{L}`, "u").test(plain),
  );
  return sansNom.length === 0
    ? { ok: true, detail: "chantiers au format CH-XXX — Nom" }
    : {
        ok: false,
        detail: `chantiers cités sans leur nom : ${sansNom.join(", ")}`,
      };
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
 * Un résumé recopie un commentaire quand il en reprend l'essentiel : 80 % de
 * ses mots, dans l'ordre, au sein d'un même paragraphe. Les calibrations du
 * 30/09 et du 01/10 l'ont montré : le juge ne sait pas comparer deux textes
 * mot à mot. Le seuil laisse passer les expressions courtes reprises
 * (« le délai médian de passage »), que la fenêtre de neuf mots du 30/09
 * signalait.
 */
const SEUIL_RECOPIE = 0.8;

function mots(text: string) {
  return normalize(text.replace(/<[^>]+>/g, " "))
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Longueur de la plus longue sous-suite de mots commune, dans l'ordre. */
function motsCommunsDansLOrdre(source: string[], texte: string[]) {
  let precedente = Array.from({ length: texte.length + 1 }, () => 0);
  for (const mot of source) {
    const courante = [0];
    texte.forEach((motDuTexte, index) => {
      courante.push(
        mot === motDuTexte
          ? precedente[index] + 1
          : Math.max(precedente[index + 1], courante[index]),
      );
    });
    precedente = courante;
  }
  return precedente[texte.length];
}

export function checkNoVerbatim({
  text,
  sources,
}: {
  text: string;
  sources: string[];
}): CheckResult {
  const paragraphes = text.split(/\n\s*\n/).map(mots);

  for (const source of sources) {
    const motsSource = mots(source);
    if (motsSource.length === 0) continue;
    const repris = Math.max(
      0,
      ...paragraphes.map((paragraphe) =>
        motsCommunsDansLOrdre(motsSource, paragraphe),
      ),
    );
    if (repris / motsSource.length >= SEUIL_RECOPIE) {
      return {
        ok: false,
        detail: `commentaire recopié à ${Math.round((100 * repris) / motsSource.length)} % : « ${source.replace(/<[^>]+>/g, "").slice(0, 80)}… »`,
      };
    }
  }

  return { ok: true, detail: "aucun commentaire recopié" };
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
