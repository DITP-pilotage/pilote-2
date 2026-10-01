import { Content, ContentText, TableCell } from "pdfmake/interfaces";
import { Dashboard31Icon } from "@/components/_commons/Icones/Dashboard31Icon";
import { MapPin21Icon } from "@/components/_commons/Icones/MapPin21Icon";
import { Error1Icon } from "@/components/_commons/Icones/Error1Icon";
import { InformationPleineIcon } from "@/components/_commons/Icones/InformationPleineIcon";
import { getMinistèreIcon } from "@/client/utils/mapperIconeMinistereVersIcone";
import { libellesMeteos } from "@/server/domain/météo/Météo.interface";
import { iconSvg, meteoPictoSvg } from "@/server/pdf/svgFromComponent";
import {
  barreDeProgressionPdf,
  MENTION_COLOR,
  PRIMARY_COLOR,
  tablePdf,
  TEXT_COLOR,
} from "@/server/pdf/primitives";
import { px, rem } from "@/server/pdf/units";
import { ChantierRapportDetailleWithoutMailles } from "@/server/rapport-detaille/rapportDetaille.interface";
import {
  ecartBadgePdf,
  tendanceBadgePdf,
} from "@/server/rapport-detaille/pdf/badges";
import { formatParisDate } from "@/server/rapport-detaille/pdf/layout";

const EMPTY_BACKGROUND = "#E8EDFF";
const EMPTY_COLOR = "#0063CB";
const ICON_SIZE = px(24);

function dateCell(date: string | null): ContentText[] {
  const formatted = formatParisDate(date, "MM/YYYY");
  return formatted
    ? [{ text: `(${formatted})`, fontSize: px(10), color: MENTION_COLOR }]
    : [];
}

function nomCell(chantier: ChantierRapportDetailleWithoutMailles): TableCell {
  return {
    columns: [
      {
        svg: iconSvg(
          getMinistèreIcon(chantier.responsables.porteur?.icône),
          PRIMARY_COLOR,
        ),
        width: ICON_SIZE,
      },
      { text: chantier.nom, fontSize: px(14), color: TEXT_COLOR, width: "*" },
    ],
    columnGap: rem(0.5),
  };
}

function typologieCell(
  chantier: ChantierRapportDetailleWithoutMailles,
): TableCell {
  const icons = [
    chantier.estBaromètre ? Dashboard31Icon : null,
    chantier.estTerritorialisé ? MapPin21Icon : null,
    chantier.statut === "BROUILLON" ? Error1Icon : null,
  ].filter((icon) => icon !== null);
  return {
    columns: icons.map((icon) => ({
      svg: iconSvg(icon, PRIMARY_COLOR),
      width: ICON_SIZE,
    })),
  };
}

function meteoCell(chantier: ChantierRapportDetailleWithoutMailles): TableCell {
  const picto = meteoPictoSvg(chantier.météo);
  return {
    stack: [
      picto
        ? { svg: picto, width: px(40), alignment: "center" }
        : {
            text: libellesMeteos[chantier.météo],
            fontSize: px(12),
            color: MENTION_COLOR,
            alignment: "center",
          },
      ...dateCell(chantier.dateDeMàjDonnéesQualitatives).map((date) => ({
        ...date,
        alignment: "center" as const,
      })),
    ],
  };
}

function avancementCell(
  chantier: ChantierRapportDetailleWithoutMailles,
  chantiersSontArchives: boolean,
): TableCell {
  return {
    stack: [
      chantier.avancement === null
        ? { text: "Non renseigné", fontSize: px(16), color: MENTION_COLOR }
        : barreDeProgressionPdf({
            valeur: chantier.avancement,
            size: "sm",
            background: "blanc",
            fill: chantiersSontArchives ? "#666666" : PRIMARY_COLOR,
            label: "side",
            width: rem(11) - 2 * px(16) - rem(3) - px(8),
          }),
      ...dateCell(chantier.dateDeMàjDonnéesQuantitatives),
    ],
  };
}

export function chantiersTablePdf(
  chantiers: ChantierRapportDetailleWithoutMailles[],
  chantiersSontArchives: boolean,
): Content {
  if (chantiers.length === 0) {
    return {
      table: {
        widths: ["*"],
        body: [
          [
            {
              fillColor: EMPTY_BACKGROUND,
              margin: [px(24), px(16), px(24), px(16)],
              columns: [
                {
                  svg: iconSvg(InformationPleineIcon, EMPTY_COLOR),
                  width: ICON_SIZE,
                },
                {
                  text: "Aucun chantier à afficher.",
                  bold: true,
                  color: EMPTY_COLOR,
                  fontSize: px(16),
                  margin: [px(8), px(2), 0, 0],
                },
              ],
            },
          ],
        ],
      },
      layout: "noBorders",
    };
  }
  return tablePdf({
    headers: [
      "Chantiers",
      "Typologie",
      "Météo",
      "Tendance",
      "Avancement",
      "Écart",
    ],
    widths: ["*", rem(6.5), rem(8), rem(7.5), rem(11), rem(5.5)],
    rows: chantiers.map((chantier) => [
      nomCell(chantier),
      typologieCell(chantier),
      meteoCell(chantier),
      tendanceBadgePdf(chantier.tendance, chantiersSontArchives) ?? "",
      avancementCell(chantier, chantiersSontArchives),
      ecartBadgePdf(chantier.ecart) ?? "",
    ]),
  });
}
