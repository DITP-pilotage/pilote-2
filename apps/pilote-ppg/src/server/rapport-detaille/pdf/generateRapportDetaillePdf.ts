import { cssLineHeight } from "@/server/pdf/units";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import { withMarianne } from "@/server/pdf/pdfmake";
import { RapportDetailleContext } from "@/server/rapport-detaille/rapportDetailleContext";
import {
  ChantierDetail,
  VueDEnsembleRapportDetaille,
} from "@/server/rapport-detaille/rapportDetaille.interface";
import { withoutMailles } from "@/server/rapport-detaille/withoutMailles";
import { pageDeGardePdf } from "@/server/rapport-detaille/pdf/pageDeGarde";
import { vueDEnsemblePdf } from "@/server/rapport-detaille/pdf/vueDEnsemble";
import { chantierPdf } from "@/server/rapport-detaille/pdf/chantier";
import {
  BODY_FONT_SIZE,
  PAGE_HEIGHT,
  PAGE_MARGIN_X,
  PAGE_MARGIN_Y,
  PAGE_WIDTH,
} from "@/server/rapport-detaille/pdf/layout";
import { TEXT_COLOR } from "@/server/pdf/primitives";

type GenerateParams = {
  vue: VueDEnsembleRapportDetaille;
  details: ChantierDetail[];
  context: RapportDetailleContext;
  hideNonApplicable: boolean;
  now: Date;
};

export function buildRapportDetailleDocument(
  params: GenerateParams,
): TDocumentDefinitions {
  const { vue, details, context } = params;
  const detailsByChantier = new Map(
    details.map((detail) => [detail.chantierId, detail]),
  );
  const fiches = vue.chantiers.flatMap((chantier) => {
    const detail = detailsByChantier.get(chantier.id);
    return detail
      ? [
          chantierPdf({
            chantier: withoutMailles(chantier),
            detail,
            context,
            hideNonApplicable: params.hideNonApplicable,
          }),
        ]
      : [];
  });
  return {
    info: { title: "Rapport détaillé - PILOTE" },
    pageSize: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
    pageMargins: [PAGE_MARGIN_X, PAGE_MARGIN_Y, PAGE_MARGIN_X, PAGE_MARGIN_Y],
    defaultStyle: {
      font: "Marianne",
      fontSize: BODY_FONT_SIZE,
      lineHeight: cssLineHeight(24, 16),
      color: TEXT_COLOR,
    },
    content: [
      pageDeGardePdf({
        territoire: vue.selectedTerritoire,
        context,
        ministères: vue.ministères,
        axes: vue.axes,
        estAutoriseAVoirLesBrouillons: vue.estAutoriseAVoirLesBrouillons,
        now: params.now,
      }),
      vueDEnsemblePdf(vue, context),
      ...fiches,
    ],
  };
}

export function generateRapportDetaillePdf(params: GenerateParams) {
  return withMarianne().createPdf(buildRapportDetailleDocument(params));
}
