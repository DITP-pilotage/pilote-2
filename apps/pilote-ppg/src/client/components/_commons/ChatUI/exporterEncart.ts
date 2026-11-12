import { slugifier } from "@/client/utils/strings";
import type { EncartOutput } from "@/server/albert/tools/encart";
import { imprimer } from "@/components/_commons/ChatUI/imprimer";

const TYPES: Record<EncartOutput["type"], string> = {
  synthese: "synthese-territoriale",
  comparaison: "comparaison-territoriale",
  synthese_chantier: "synthese-chantier",
};

/** Le nom du document : le titre de l'encart, à défaut son type et sa date. */
export const nomEncart = ({
  markdown,
  type,
  dateRedaction,
}: {
  markdown: string;
  type: EncartOutput["type"];
  dateRedaction: string;
}): string => {
  const titre = markdown.match(/^#\s+(.+)$/m)?.[1];
  return titre
    ? slugifier({ texte: titre })
    : `${TYPES[type]}-${dateRedaction.slice(0, 10)}`;
};

/** Les éléments de l'encart à ne pas imprimer, comme ses boutons. */
export const horsImpression = () => ({ "data-hors-impression": "" });

/** Le PDF d'une synthèse ou d'une comparaison : l'encart tel qu'affiché. */
export const imprimerEncart = ({
  encart,
  titre,
}: {
  encart: HTMLElement;
  titre: string;
}): Promise<void> => imprimer({ contenu: encart, titre });
