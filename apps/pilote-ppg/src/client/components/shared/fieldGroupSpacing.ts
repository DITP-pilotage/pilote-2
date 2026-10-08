// Marge de .fr-input-group / .fr-select-group du DSFR entre deux champs d'un formulaire.
export const FIELD_GROUP_SPACING = "[&:not(:last-child)]:mb-6";

// Un champ espacé remplace cette marge par une ligne de même hauteur réservée à
// son message d'erreur : l'apparition de l'erreur ne décale pas la suite.
export const ERROR_SLOT_CLASSES =
  "min-h-6 pt-1 [:last-child>&]:min-h-0 text-xs leading-5 text-dsfr-error-425 mb-0";

export const splitFieldGroupSpacing = (className?: string) => {
  const classes = (className ?? "").split(/\s+/).filter(Boolean);
  return {
    spaced: classes.includes(FIELD_GROUP_SPACING),
    className: classes
      .filter((classe) => classe !== FIELD_GROUP_SPACING)
      .join(" "),
  };
};
