import { Content } from "pdfmake/interfaces";
import { Maille } from "@/shared/maille/Maille.interface";
import { encartPdf, sectionTitlePdf } from "@/server/pdf/primitives";
import { section } from "@/server/rapport-detaille/pdf/section";
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
import { cartesPdf } from "@/server/rapport-detaille/pdf/cartes";
import {
  commentairesPdf,
  decisionsPdf,
  objectifsPdf,
} from "@/server/rapport-detaille/pdf/publications";
import { indicateursPdf } from "@/server/rapport-detaille/pdf/indicateurs";

export function chantierPdf(params: {
  chantier: ChantierRapportDetailleWithoutMailles;
  detail: ChantierDetail;
  context: RapportDetailleContext;
  hideNonApplicable?: boolean;
}): Content {
  const { chantier, detail, context } = params;
  const territoire = findTerritoire(context.territoireCode);
  const territoireMaille: Maille =
    territoire?.maille === "regionale" ||
    territoire?.maille === "departementale"
      ? territoire.maille
      : "nationale";
  const sections: (Content | null)[] = [
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
    cartesPdf({ chantier, detail, context }),
    objectifsPdf(detail.objectifs),
    indicateursPdf({
      indicateurs: detail.indicateurs,
      détailsIndicateurs: detail.détailsIndicateurs,
      listeIndicateursPrisEnCompteAvancement:
        detail.listeIndicateursPrisEnCompteAvancement,
      context,
      hideNonApplicable: params.hideNonApplicable ?? false,
    }),
    decisionsPdf(detail.décisionStratégique, context),
    commentairesPdf(detail.commentaires, context),
  ];
  return {
    stack: sections.filter((content): content is Content => content !== null),
    pageBreak: "before",
  };
}
