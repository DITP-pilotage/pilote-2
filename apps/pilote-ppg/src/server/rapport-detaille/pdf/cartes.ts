import { Content } from "pdfmake/interfaces";
import { ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieAvancement";
import { ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieMétéo";
import { getAvancementLegend } from "@/components/_commons/Cartographie/CartographieAvancement/avancementFill";
import { getMeteoLegend } from "@/components/_commons/Cartographie/CartographieMétéo/meteoFill";
import { Meteo, meteos } from "@/shared/meteo/Meteo.interface";
import { blocRowPdf, TITLE_COLOR } from "@/server/pdf/primitives";
import { meteoPictoSvg } from "@/server/pdf/svgFromComponent";
import { rem } from "@/server/pdf/units";
import { RapportDetailleContext } from "@/server/rapport-detaille/rapportDetailleContext";
import {
  ChantierDetail,
  ChantierRapportDetailleWithoutMailles,
} from "@/server/rapport-detaille/rapportDetaille.interface";
import {
  avancementCarteSvg,
  cartographieLegendPdf,
  meteoCarteSvg,
} from "@/server/rapport-detaille/pdf/cartographie";
import { titleWithInfoPdf } from "@/server/rapport-detaille/pdf/vueDEnsemble";
import { section } from "@/server/rapport-detaille/pdf/section";
import { CONTENT_WIDTH, GRID_GAP } from "@/server/rapport-detaille/pdf/layout";

function isMeteo(value: string): value is Meteo {
  return meteos.some((meteo) => meteo === value);
}

function carteBloc(titre: string, svg: string, legend: Content) {
  return {
    content: {
      stack: [
        titleWithInfoPdf(titre, { color: TITLE_COLOR }),
        { svg, width: rem(25), alignment: "center" as const },
        legend,
      ],
    },
  };
}

export function cartesPdf(params: {
  chantier: ChantierRapportDetailleWithoutMailles;
  detail: ChantierDetail;
  context: RapportDetailleContext;
}): Content | null {
  const { chantier, detail, context } = params;
  const maille = context.selectedMaille;
  const showAvancement =
    Boolean(chantier.tauxAvancementDonnéeTerritorialisée[maille]) ||
    chantier.estTerritorialisé;
  const showMeteo =
    Boolean(chantier.météoDonnéeTerritorialisée[maille]) ||
    chantier.estTerritorialisé;
  if (!showAvancement && !showMeteo) return null;

  const cartes: ReturnType<typeof carteBloc>[] = [];
  if (showAvancement) {
    cartes.push(
      carteBloc(
        `Taux d'avancement ${context.jalon}`,
        avancementCarteSvg({
          territoireCode: context.territoireCode,
          selectedMaille: maille,
          données: detail.donnéesCartographieAvancement,
        }),
        cartographieLegendPdf(
          getAvancementLegend(
            detail.donnéesCartographieAvancement,
            ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS,
          ),
        ),
      ),
    );
  }
  if (showMeteo) {
    cartes.push(
      carteBloc(
        "Niveau de confiance",
        meteoCarteSvg({
          territoireCode: context.territoireCode,
          selectedMaille: maille,
          données: detail.donnéesCartographieMétéo,
        }),
        cartographieLegendPdf(
          getMeteoLegend(
            detail.donnéesCartographieMétéo,
            ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS,
          ).map((entry) => {
            const meteoKey = Object.entries(
              ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS,
            ).find(([, élément]) => élément.libellé === entry.libellé)?.[0];
            return {
              ...entry,
              pictoSvg:
                meteoKey && isMeteo(meteoKey) ? meteoPictoSvg(meteoKey) : null,
            };
          }),
        ),
      ),
    );
  }
  return section(
    "Répartition géographique",
    blocRowPdf(cartes, { columns: 2, width: CONTENT_WIDTH, gap: GRID_GAP }),
  );
}
