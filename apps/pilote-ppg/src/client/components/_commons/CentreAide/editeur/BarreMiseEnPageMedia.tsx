import { ComponentType, FunctionComponent } from "react";
import { AlignCenterIcon } from "@/components/_commons/Icones/AlignCenterIcon";
import { AlignLeftIcon } from "@/components/_commons/Icones/AlignLeftIcon";
import { AlignRightIcon } from "@/components/_commons/Icones/AlignRightIcon";
import {
  ALIGNEMENTS,
  LARGEURS,
  type AlignementMedia,
  type LargeurMedia,
} from "../alignementMedia";
import { FloatingToolbar, FloatingToolbarButton } from "./FloatingToolbar";

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

export const BarreMiseEnPageMedia: FunctionComponent<{
  alignement: AlignementMedia;
  largeur: LargeurMedia;
  onAlignement: (alignement: AlignementMedia) => void;
  onLargeur: (largeur: LargeurMedia) => void;
}> = ({ alignement, largeur, onAlignement, onLargeur }) => (
  <FloatingToolbar>
    {ALIGNEMENTS.map((valeur) => {
      const Icone = ICONES_ALIGNEMENT[valeur];
      return (
        <FloatingToolbarButton
          actif={alignement === valeur}
          key={valeur}
          label={LABELS_ALIGNEMENT[valeur]}
          onClick={() => onAlignement(valeur)}
        >
          <Icone className="w-4 h-4" fill="currentColor" />
        </FloatingToolbarButton>
      );
    })}

    <span aria-hidden className="mx-1 h-5 w-px bg-white/20" />

    {LARGEURS.map((valeur) => (
      <FloatingToolbarButton
        actif={largeur === valeur}
        key={valeur}
        label={LABELS_LARGEUR[valeur]}
        onClick={() => onLargeur(valeur)}
      >
        <span className="text-xs font-semibold">
          {ABREVIATIONS_LARGEUR[valeur]}
        </span>
      </FloatingToolbarButton>
    ))}
  </FloatingToolbar>
);
