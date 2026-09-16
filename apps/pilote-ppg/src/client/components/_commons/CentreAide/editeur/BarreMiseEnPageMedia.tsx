import { ComponentType, FunctionComponent } from "react";
import { AlignCenterIcon } from "@/components/_commons/Icones/AlignCenterIcon";
import { AlignLeftIcon } from "@/components/_commons/Icones/AlignLeftIcon";
import { AlignRightIcon } from "@/components/_commons/Icones/AlignRightIcon";
import { clsxm } from "@/utils/clsxm";
import {
  ALIGNEMENTS,
  LARGEURS,
  type AlignementMedia,
  type LargeurMedia,
} from "../alignementMedia";

const ICONES_ALIGNEMENT: Record<
  AlignementMedia,
  ComponentType<{ className?: string; fill?: string }>
> = {
  gauche: AlignLeftIcon,
  centre: AlignCenterIcon,
  droite: AlignRightIcon,
};

const LABELS_ALIGNEMENT: Record<AlignementMedia, string> = {
  gauche: "Aligner à gauche",
  centre: "Centrer",
  droite: "Aligner à droite",
};

const LABELS_LARGEUR: Record<LargeurMedia, string> = {
  petite: "Petite largeur",
  moyenne: "Largeur moyenne",
  pleine: "Pleine largeur",
};

const ABREVIATIONS_LARGEUR: Record<LargeurMedia, string> = {
  petite: "S",
  moyenne: "M",
  pleine: "L",
};

const Bouton: FunctionComponent<{
  actif: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ actif, label, onClick, children }) => (
  <button
    aria-label={label}
    aria-pressed={actif}
    className={clsxm(
      "flex h-7 w-7 items-center justify-center rounded text-white/90 transition-colors hover:bg-white/15",
      actif && "bg-white/20 text-white",
    )}
    // Empêche le blur : la sélection du nœud média reste active au clic.
    onClick={onClick}
    onMouseDown={(event) => event.preventDefault()}
    title={label}
    type="button"
  >
    {children}
  </button>
);

export const BarreMiseEnPageMedia: FunctionComponent<{
  alignement: AlignementMedia;
  largeur: LargeurMedia;
  onAlignement: (alignement: AlignementMedia) => void;
  onLargeur: (largeur: LargeurMedia) => void;
}> = ({ alignement, largeur, onAlignement, onLargeur }) => (
  <div
    className="absolute -top-10 left-0 z-10 flex items-center gap-0.5 rounded-lg bg-gray-800 p-1 shadow-lg"
    contentEditable={false}
  >
    {ALIGNEMENTS.map((valeur) => {
      const Icone = ICONES_ALIGNEMENT[valeur];
      return (
        <Bouton
          actif={alignement === valeur}
          key={valeur}
          label={LABELS_ALIGNEMENT[valeur]}
          onClick={() => onAlignement(valeur)}
        >
          <Icone className="w-4 h-4" fill="currentColor" />
        </Bouton>
      );
    })}

    <span aria-hidden className="mx-1 h-5 w-px bg-white/20" />

    {LARGEURS.map((valeur) => (
      <Bouton
        actif={largeur === valeur}
        key={valeur}
        label={LABELS_LARGEUR[valeur]}
        onClick={() => onLargeur(valeur)}
      >
        <span className="text-xs font-semibold">
          {ABREVIATIONS_LARGEUR[valeur]}
        </span>
      </Bouton>
    ))}
  </div>
);
