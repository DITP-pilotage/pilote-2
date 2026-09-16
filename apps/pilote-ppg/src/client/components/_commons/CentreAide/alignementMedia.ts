export const ALIGNEMENTS = ["gauche", "centre", "droite"] as const;
export const LARGEURS = ["petite", "moyenne", "pleine"] as const;

export type AlignementMedia = (typeof ALIGNEMENTS)[number];
export type LargeurMedia = (typeof LARGEURS)[number];

export const ALIGNEMENT_PAR_DEFAUT: AlignementMedia = "gauche";
export const LARGEUR_PAR_DEFAUT: LargeurMedia = "moyenne";

// L'alignement se joue sur les marges : un media est un bloc, text-align n'a
// aucun effet dessus.
const CLASSES_ALIGNEMENT: Record<AlignementMedia, string> = {
  gauche: "mr-auto",
  centre: "mx-auto",
  droite: "ml-auto",
};

const CLASSES_LARGEUR: Record<LargeurMedia, string> = {
  petite: "max-w-[320px]",
  moyenne: "max-w-[560px]",
  pleine: "max-w-full",
};

export const estAlignement = (valeur: unknown): valeur is AlignementMedia =>
  ALIGNEMENTS.includes(valeur as AlignementMedia);

export const estLargeur = (valeur: unknown): valeur is LargeurMedia =>
  LARGEURS.includes(valeur as LargeurMedia);

export const lireAlignement = (valeur: unknown): AlignementMedia =>
  estAlignement(valeur) ? valeur : ALIGNEMENT_PAR_DEFAUT;

export const lireLargeur = (valeur: unknown): LargeurMedia =>
  estLargeur(valeur) ? valeur : LARGEUR_PAR_DEFAUT;

export const classesMedia = ({
  alignement,
  largeur,
}: {
  alignement?: unknown;
  largeur?: unknown;
}): string =>
  `block w-full ${CLASSES_LARGEUR[lireLargeur(largeur)]} ${CLASSES_ALIGNEMENT[lireAlignement(alignement)]}`;
