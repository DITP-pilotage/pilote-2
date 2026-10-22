import { Content } from "pdfmake/interfaces";
import { ArrowRightUp1Icon } from "@/components/_commons/Icones/ArrowRightUp1Icon";
import { ArrowRightDown1Icon } from "@/components/_commons/Icones/ArrowRightDown1Icon";
import { ArrowLine1Icon } from "@/components/_commons/Icones/ArrowLine1Icon";
import {
  definirCouleurEcartArrondi,
  VARIANTE_BADGE_ECART,
} from "@/client/utils/chantier/écart/écart";
import { Meteo, libellesMeteos } from "@/shared/meteo/Meteo.interface";
import { badgePdf, BadgeVariant } from "@/server/pdf/primitives";
import { iconSvg } from "@/server/pdf/svgFromComponent";
import { color } from "@/server/pdf/colors";

type Tendance = "HAUSSE" | "BAISSE" | "STAGNATION" | null;

const TENDANCES = {
  HAUSSE: {
    variant: "success",
    icon: ArrowRightUp1Icon,
    label: "En hausse",
    color: color("dsfr-success-425"),
  },
  BAISSE: {
    variant: "error",
    icon: ArrowRightDown1Icon,
    label: "En baisse",
    color: color("dsfr-error-425"),
  },
  STAGNATION: {
    variant: "info",
    icon: ArrowLine1Icon,
    label: "Stable",
    color: color("dsfr-info-425"),
  },
} as const;

export function tendanceBadgePdf(
  tendance: Tendance,
  estArchive = false,
): Content | null {
  if (!tendance) return null;
  const { variant, icon, label, color: tendanceColor } = TENDANCES[tendance];
  return badgePdf(label, estArchive ? "default" : variant, {
    iconSvg: iconSvg(icon, estArchive ? color("dsfr-grey-200") : tendanceColor),
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
  ORAGE: "error",
  NUAGE: "green-tilleul",
  COUVERT: "info",
  SOLEIL: "success",
  NON_NECESSAIRE: "default",
  NON_RENSEIGNEE: "default",
};

export function meteoBadgePdf(meteo: Meteo): Content {
  return badgePdf(libellesMeteos[meteo], METEO_BADGE_VARIANTS[meteo]);
}
