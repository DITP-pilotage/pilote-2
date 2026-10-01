import { Content } from "pdfmake/interfaces";
import { ArrowRightUp1Icon } from "@/components/_commons/Icones/ArrowRightUp1Icon";
import { ArrowRightDown1Icon } from "@/components/_commons/Icones/ArrowRightDown1Icon";
import { ArrowLine1Icon } from "@/components/_commons/Icones/ArrowLine1Icon";
import {
  definirCouleurEcartArrondi,
  VARIANTE_BADGE_ECART,
} from "@/client/utils/chantier/écart/écart";
import { Meteo, libellesMeteos } from "@/server/domain/météo/Météo.interface";
import { badgePdf, BadgeVariant } from "@/server/pdf/primitives";
import { iconSvg } from "@/server/pdf/svgFromComponent";

type Tendance = "HAUSSE" | "BAISSE" | "STAGNATION" | null;

const TENDANCES = {
  HAUSSE: {
    variant: "succes",
    icon: ArrowRightUp1Icon,
    label: "En hausse",
    color: "#18753C",
  },
  BAISSE: {
    variant: "erreur",
    icon: ArrowRightDown1Icon,
    label: "En baisse",
    color: "#CE0500",
  },
  STAGNATION: {
    variant: "info",
    icon: ArrowLine1Icon,
    label: "Stable",
    color: "#0063CB",
  },
} as const;

export function tendanceBadgePdf(
  tendance: Tendance,
  estArchive = false,
): Content | null {
  if (!tendance) return null;
  const { variant, icon, label, color } = TENDANCES[tendance];
  return badgePdf(label, estArchive ? "defaut" : variant, {
    iconSvg: iconSvg(icon, estArchive ? "#3A3A3A" : color),
  });
}

export function ecartBadgePdf(
  ecart: number | null,
  options: { withLabel?: boolean } = {},
): Content | null {
  const ecartArrondi = definirCouleurEcartArrondi(ecart);
  if (!ecartArrondi) return null;
  const value = ecartArrondi.ecartArrondi.toFixed(1);
  return badgePdf(
    options.withLabel ? `${ecartArrondi.commentaire} : ${value}` : value,
    VARIANTE_BADGE_ECART[ecartArrondi.couleur],
  );
}

const METEO_BADGE_VARIANTS: Record<Meteo, BadgeVariant> = {
  ORAGE: "erreur",
  NUAGE: "vert-tilleul",
  COUVERT: "info",
  SOLEIL: "succes",
  NON_NECESSAIRE: "defaut",
  NON_RENSEIGNEE: "defaut",
};

export function meteoBadgePdf(meteo: Meteo): Content {
  return badgePdf(libellesMeteos[meteo], METEO_BADGE_VARIANTS[meteo]);
}
