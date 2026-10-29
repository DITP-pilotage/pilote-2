import type { ReactNode } from "react";
import { useAlbertConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";
import type { VueAssistant } from "@/components/_commons/ChatUI/affichageAssistant";
import { clsxm } from "@/utils/clsxm";

// Chaque pictogramme dessine la vue : la page, et la place qu'y prend
// l'assistant.
const Pictogramme = ({ children }: { children: ReactNode }) => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <rect height="16" width="18" x="3" y="4" />
    {children}
  </svg>
);

const OPTIONS: {
  vue: VueAssistant;
  libelle: string;
  pictogramme: ReactNode;
}[] = [
  {
    vue: "floating",
    libelle: "Fenêtre flottante",
    pictogramme: (
      <rect
        fill="currentColor"
        height="5"
        stroke="none"
        width="6"
        x="12"
        y="12"
      />
    ),
  },
  {
    vue: "sidePanel",
    libelle: "Panneau latéral",
    pictogramme: (
      <rect
        fill="currentColor"
        height="16"
        stroke="none"
        width="7"
        x="14"
        y="4"
      />
    ),
  },
  {
    vue: "modal",
    libelle: "Plein écran",
    pictogramme: (
      <rect
        fill="currentColor"
        height="10"
        stroke="none"
        width="12"
        x="6"
        y="7"
      />
    ),
  },
];

export const SelecteurVue = () => {
  const { display, vuesDisponibles, changerVue } = useAlbertConversation();

  // Sur un écran étroit, la modale est la seule vue possible.
  if (vuesDisponibles.length < 2) return null;

  return (
    <div
      aria-label="Affichage de l'assistant"
      className="flex shrink-0 border border-dsfr-grey-900"
      role="group"
    >
      {OPTIONS.filter(({ vue }) => vuesDisponibles.includes(vue)).map(
        ({ vue, libelle, pictogramme }) => {
          const active = display === vue;
          return (
            <button
              aria-label={libelle}
              aria-pressed={active}
              className={clsxm(
                "flex h-[30px] w-8 items-center justify-center border-l border-dsfr-grey-900 transition-colors first:border-l-0",
                active
                  ? "bg-primary text-white"
                  : "bg-white text-primary hover:bg-dsfr-alt-blue-france",
              )}
              key={vue}
              onClick={() => {
                if (!active) changerVue(vue);
              }}
              title={libelle}
              type="button"
            >
              <Pictogramme>{pictogramme}</Pictogramme>
            </button>
          );
        },
      )}
    </div>
  );
};
