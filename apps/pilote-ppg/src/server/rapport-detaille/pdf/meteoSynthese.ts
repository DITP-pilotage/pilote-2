import { Column, Content } from "pdfmake/interfaces";
import SynthèseDesRésultats from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface";
import { htmlToPdfmake } from "@/server/pdf/htmlToPdfmake";
import { blocPdf, MENTION_COLOR } from "@/server/pdf/primitives";
import { meteoPictoSvg } from "@/server/pdf/svgFromComponent";
import { px, rem } from "@/server/pdf/units";
import { meteoBadgePdf } from "@/server/rapport-detaille/pdf/badges";
import { formatParisDate } from "@/server/rapport-detaille/pdf/layout";

export function meteoSynthesePdf(
  synthèse: SynthèseDesRésultats,
  nomTerritoire: string,
): Content {
  const picto = synthèse ? meteoPictoSvg(synthèse.météo) : null;
  const meteoColumn: Column = {
    width: "auto",
    stack: [
      {
        stack: [meteoBadgePdf(synthèse?.météo ?? "NON_RENSEIGNEE")],
        margin: [rem(0.5), 0, rem(0.5), rem(1)],
      },
      ...(picto
        ? [{ svg: picto, width: px(40), alignment: "center" as const }]
        : []),
    ],
  };
  const détails: Content[] = synthèse
    ? [
        {
          text: `Mis à jour le ${formatParisDate(synthèse.date, "DD/MM/YYYY")}${synthèse.auteur ? ` | Par ${synthèse.auteur}` : ""}`,
          fontSize: px(16),
          color: MENTION_COLOR,
          margin: [0, 0, 0, px(8)],
        },
        ...htmlToPdfmake(synthèse.contenu),
      ]
    : [
        {
          text: "Aucune synthèse des résultats.",
          fontSize: px(16),
          color: MENTION_COLOR,
        },
      ];
  return blocPdf({
    titre: nomTerritoire,
    content: {
      columns: [meteoColumn, { width: "*", stack: détails }],
      columnGap: rem(1),
      margin: [0, px(8), 0, px(8)],
    },
  });
}
