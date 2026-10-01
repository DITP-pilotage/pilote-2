import { Content } from "pdfmake/interfaces";
import { Maille } from "@/server/domain/maille/Maille.interface";
import { encartPdf, sectionTitlePdf } from "@/server/pdf/primitives";
import { rem } from "@/server/pdf/units";
import { RapportDetailleContext } from "@/server/rapport-detaille/rapportDetailleContext";
import {
  ChantierDetail,
  ChantierRapportDetailleWithoutMailles,
} from "@/server/rapport-detaille/rapportDetaille.interface";
import {
  avancementPdf,
  findTerritoire,
} from "@/server/rapport-detaille/pdf/avancement";
import { responsablesPdf } from "@/server/rapport-detaille/pdf/responsables";
import { meteoSynthesePdf } from "@/server/rapport-detaille/pdf/meteoSynthese";

export function section(titre: string, content: Content): Content {
  return {
    stack: [sectionTitlePdf(titre), content],
    margin: [0, rem(1), 0, rem(1)],
    unbreakable: true,
  };
}

export function chantierPdf(params: {
  chantier: ChantierRapportDetailleWithoutMailles;
  detail: ChantierDetail;
  context: RapportDetailleContext;
  extraSections?: Content[];
}): Content {
  const { chantier, detail, context } = params;
  const territoire = findTerritoire(context.territoireCode);
  const territoireMaille: Maille =
    territoire?.maille === "regionale" ||
    territoire?.maille === "departementale"
      ? territoire.maille
      : "nationale";
  return {
    stack: [
      encartPdf(chantier.nom, "h1"),
      {
        stack: [
          sectionTitlePdf("Avancement du chantier", {
            margin: [0, rem(1.5), 0, rem(1)],
          }),
          avancementPdf({ chantier, detail, context }),
        ],
      },
      section("Responsables", responsablesPdf(chantier, territoireMaille)),
      section(
        "Météo et synthèse des résultats",
        meteoSynthesePdf(
          detail.synthèseDesRésultats,
          territoire?.nomAffiché ?? "",
        ),
      ),
      ...(params.extraSections ?? []),
    ],
    pageBreak: "before",
  };
}
