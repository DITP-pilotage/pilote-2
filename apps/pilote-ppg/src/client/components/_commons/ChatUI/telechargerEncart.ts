import type { EncartOutput } from "@/server/albert/tools/encart";

const TYPES: Record<EncartOutput["type"], string> = {
  synthese: "synthese-territoriale",
  comparaison: "comparaison-territoriale",
};

const slug = (texte: string): string =>
  texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Le nom du fichier : le titre de l'encart, à défaut son type et sa date. */
export const nomFichierEncart = ({
  markdown,
  type,
  dateRedaction,
}: {
  markdown: string;
  type: EncartOutput["type"];
  dateRedaction: string;
}): string => {
  const titre = markdown.match(/^#\s+(.+)$/m)?.[1];
  return `${titre ? slug(titre) : `${TYPES[type]}-${dateRedaction}`}.md`;
};

/**
 * Le rapport d'une synthèse ou d'une comparaison : le contenu de l'encart tel
 * qu'affiché, téléchargé côté navigateur, sans appel au modèle (PIL-1900).
 */
export const telechargerEncart = ({
  markdown,
  nomFichier,
}: {
  markdown: string;
  nomFichier: string;
}): void => {
  const url = URL.createObjectURL(
    new Blob([markdown], { type: "text/markdown;charset=utf-8" }),
  );
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichier;
  lien.click();
  URL.revokeObjectURL(url);
};
