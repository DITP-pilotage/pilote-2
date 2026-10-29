export const VUES_ASSISTANT = ["modal", "sidePanel", "floating"] as const;

export type VueAssistant = (typeof VUES_ASSISTANT)[number];

export type AffichageAssistant = VueAssistant | "minimized";

export type TailleEcran = "etroite" | "moyenne" | "large";

// Le panneau prend 440 px à la page : il faut un écran large pour que les
// pages gardent la largeur pour laquelle elles sont conçues. La fenêtre
// flottante, elle, se pose par-dessus la page.
const VUES_PAR_TAILLE: Record<TailleEcran, readonly VueAssistant[]> = {
  etroite: ["modal"],
  moyenne: ["floating", "modal"],
  large: ["floating", "sidePanel", "modal"],
};

const VUE_DE_REPLI: Record<VueAssistant, VueAssistant | null> = {
  sidePanel: "floating",
  floating: "modal",
  modal: null,
};

export const vuesDisponibles = (
  tailleEcran: TailleEcran,
): readonly VueAssistant[] => VUES_PAR_TAILLE[tailleEcran];

// Une vue qui ne tient pas sur l'écran se replie sur la suivante, sans que la
// vue demandée soit oubliée pour un écran plus large.
export const affichageEffectif = ({
  affichage,
  tailleEcran,
}: {
  affichage: AffichageAssistant;
  tailleEcran: TailleEcran;
}): AffichageAssistant => {
  if (affichage === "minimized") return affichage;

  let vue: VueAssistant | null = affichage;
  while (vue && !vuesDisponibles(tailleEcran).includes(vue)) {
    vue = VUE_DE_REPLI[vue];
  }
  return vue ?? "modal";
};

export const LARGEUR_PANNEAU = { min: 400, max: 720, parDefaut: 520 } as const;

// Ce que le panneau laisse au moins à la page : en dessous, les pages à
// barre latérale (accueil, chantier) n'ont plus la place de s'afficher.
const LARGEUR_PAGE_MIN = 900;

export const bornerLargeurPanneau = ({
  largeur,
  largeurEcran,
}: {
  largeur: number;
  largeurEcran: number;
}): number => {
  const max = Math.max(
    LARGEUR_PANNEAU.min,
    Math.min(LARGEUR_PANNEAU.max, largeurEcran - LARGEUR_PAGE_MIN),
  );
  return Math.round(Math.min(max, Math.max(LARGEUR_PANNEAU.min, largeur)));
};
