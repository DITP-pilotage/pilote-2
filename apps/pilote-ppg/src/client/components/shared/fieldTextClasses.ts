// Textes des champs du DSFR (feuille form) : libellé, aide et message d'erreur.
export const LABEL_CLASSES = "block text-base leading-6 text-dsfr-grey-50";

export const HINT_TEXT_CLASSES =
  "block text-xs leading-5 text-dsfr-mention-grey [--text-spacing:0_0_1rem] print:text-base print:leading-6";

export const ERROR_TEXT_CLASSES =
  "flex flex-row items-center text-xs leading-5 mt-4 mb-0 text-dsfr-error-425 before:mr-1 before:inline-block before:size-4 before:flex-[0_0_auto] before:bg-current before:align-[calc((0.75em-1rem)*0.5)] before:[mask-image:url(/dsfr/icons/system/fr--error-fill.svg)] before:[mask-size:100%_100%] before:content-[''] forced-colors:before:bg-[canvastext] forced-colors:before:[forced-color-adjust:none]";

// Barre rouge à gauche d'un groupe de champs en erreur (fr-input-group--error).
export const ERROR_GROUP_CLASSES =
  "before:pointer-events-none before:absolute before:inset-y-0 before:-left-3 before:-right-3 before:block before:bg-no-repeat before:[background-image:linear-gradient(0deg,theme(colors.dsfr-error-425),theme(colors.dsfr-error-425))] before:[background-position:0_0] before:[background-size:0.125rem_100%] before:content-['']";
