import {
  FichierTabulaireIllisibleError,
  lireEntreesZip,
} from "@/server/infrastructure/fichier-tabulaire/lireZip";

const FEUILLE = "xl/worksheets/sheet1.xml";
const CHAINES_PARTAGEES = "xl/sharedStrings.xml";
const PROPRIETES = "docProps/app.xml";

export type LectureXlsx = { lignes: string[][]; producteur: string | null };

const ENTITES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
};

function decoder(texte: string): string {
  return texte
    .replace(/&(amp|lt|gt|quot|apos);/g, (entite) => ENTITES[entite])
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    );
}

/** Concatène le texte de tous les <t> d'un fragment : gère aussi le rich text. */
function texteDesBalisesT(fragment: string): string {
  const morceaux = fragment.match(/<t[^>]*>([\s\S]*?)<\/t>/g) ?? [];
  return morceaux
    .map((balise) =>
      decoder(balise.replace(/^<t[^>]*>/, "").replace(/<\/t>$/, "")),
    )
    .join("");
}

function lireChainesPartagees(xml: string): string[] {
  const items = xml.match(/<si\b[^>]*>[\s\S]*?<\/si>|<si\b[^>]*\/>/g) ?? [];
  return items.map(texteDesBalisesT);
}

/** "C5" -> 2 (index de colonne, 0-based). */
function indexColonne(reference: string): number {
  const lettres = reference.replace(/\d+$/, "");
  let index = 0;
  for (const lettre of lettres) {
    index = index * 26 + (lettre.charCodeAt(0) - 64);
  }
  return index - 1;
}

export function lireXlsx(archive: Buffer): LectureXlsx {
  const entrees = lireEntreesZip(archive, [
    FEUILLE,
    CHAINES_PARTAGEES,
    PROPRIETES,
  ]);

  const feuille = entrees.get(FEUILLE);
  if (!feuille) {
    throw new FichierTabulaireIllisibleError(
      "feuille-introuvable",
      "Le classeur ne contient pas de feuille lisible. Enregistrez-le au format .xlsx standard.",
    );
  }

  const chaines = entrees.has(CHAINES_PARTAGEES)
    ? lireChainesPartagees(entrees.get(CHAINES_PARTAGEES)!.toString("utf-8"))
    : [];

  const producteur =
    entrees
      .get(PROPRIETES)
      ?.toString("utf-8")
      .match(/<Application>([\s\S]*?)<\/Application>/)?.[1] ?? null;

  const xml = feuille.toString("utf-8");
  const parLigne = new Map<number, Map<number, string>>();
  let ligneMax = 0;

  const balisesLigne =
    xml.match(/<row\b[^>]*>[\s\S]*?<\/row>|<row\b[^>]*\/>/g) ?? [];

  for (const balise of balisesLigne) {
    // Le numéro vient de l'attribut `r`, jamais d'un compteur : une ligne vide
    // au milieu du fichier ne doit décaler aucune des suivantes.
    const numeroLigne = Number(balise.match(/\br="(\d+)"/)?.[1] ?? 0);
    if (numeroLigne === 0) continue;
    ligneMax = Math.max(ligneMax, numeroLigne);

    const cellules = new Map<number, string>();
    const balisesCellule =
      balise.match(/<c\b[^>]*>[\s\S]*?<\/c>|<c\b[^>]*\/>/g) ?? [];

    for (const cellule of balisesCellule) {
      // La position vient de `r` (ex. "C5") : une cellule vide intercalée,
      // absente du XML, ne doit pas décaler les colonnes suivantes.
      const reference = cellule.match(/\br="([A-Z]+\d+)"/)?.[1];
      if (!reference) continue;
      const colonne = indexColonne(reference);

      const type = cellule.match(/\bt="([^"]+)"/)?.[1] ?? "n";
      let valeur = "";

      if (type === "inlineStr") {
        valeur = texteDesBalisesT(cellule);
      } else {
        const brut = cellule.match(/<v[^>]*>([\s\S]*?)<\/v>/)?.[1];
        if (brut !== undefined) {
          // `s` : index dans sharedStrings. `str` : valeur en cache d'une
          // formule — sans ce cas on obtient "[object Object]" (PLTT-330).
          // Tout le reste est rendu tel quel : ni Number(), ni Date, qui
          // décaleraient les nombres et les dates.
          valeur = type === "s" ? (chaines[Number(brut)] ?? "") : decoder(brut);
        }
      }

      if (valeur !== "") cellules.set(colonne, valeur);
    }

    parLigne.set(numeroLigne, cellules);
  }

  const lignes: string[][] = [];

  for (let numero = 1; numero <= ligneMax; numero += 1) {
    const cellules = parLigne.get(numero) ?? new Map<number, string>();
    // Chaque ligne s'arrête à sa propre dernière cellule renseignée. C'est ce
    // qui permet ensuite de distinguer une cellule vide d'une cellule absente,
    // et donc de détecter une ligne plus courte que le schéma.
    const derniereColonne = Math.max(-1, ...cellules.keys());
    lignes.push(
      Array.from(
        { length: derniereColonne + 1 },
        (_, colonne) => cellules.get(colonne) ?? "",
      ),
    );
  }

  return { lignes, producteur };
}
