import { Content } from "pdfmake/interfaces";
import Axe from "@/server/domain/axe/Axe.interface";
import Ministère from "@/server/domain/ministère/Ministère.interface";
import { Territoire } from "@/server/domain/territoire/Territoire.interface";
import { px, rem, cssLineHeight } from "@/server/pdf/units";
import { TEXT_COLOR, TITLE_COLOR } from "@/server/pdf/primitives";
import { RapportDetailleContext } from "@/server/rapport-detaille/rapportDetailleContext";
import {
  DEVISE_SVG,
  DRAPEAU_SVG,
} from "@/server/rapport-detaille/pdf/blocMarque";
import { formatParisDate } from "@/server/rapport-detaille/pdf/layout";

const TITLE_BAND_BACKGROUND = "#F5F5FE";
const FILTERS_COLUMN_MAX_HEIGHT = 567;
const FILTER_LINE_HEIGHT = px(24);

type FilterGroup = { titre: string; items: Content[]; lineCount: number };

function groupedPérimètres(
  ministères: Ministère[],
  perimetreIds: string[],
): { nom: string; périmètres: string[] }[] {
  return ministères
    .map((ministère) => {
      const hasSinglePérimètre = ministère.périmètresMinistériels.length === 1;
      const selected = ministère.périmètresMinistériels.filter((périmètre) =>
        perimetreIds.includes(périmètre.id),
      );
      if (hasSinglePérimètre && selected.length === 1) {
        return { nom: ministère.nom, périmètres: [ministère.nom] };
      }
      return {
        nom: ministère.nom,
        périmètres: selected.map((périmètre) => périmètre.nom),
      };
    })
    .filter((ministère) => ministère.périmètres.length > 0);
}

function typologieFilters(
  context: RapportDetailleContext,
  estAutoriseAVoirLesBrouillons: boolean,
): string[] {
  const { statut } = context.filters;
  const statutLabel = estAutoriseAVoirLesBrouillons
    ? statut.includes("BROUILLON") && statut.includes("PUBLIE")
      ? "Chantiers validés et en cours de publication"
      : statut.includes("BROUILLON")
        ? "Chantiers en cours de publication"
        : "Chantiers validés"
    : null;
  return [
    context.filters.estBarometre ? "Chantiers du baromètre" : null,
    context.territorialiseFilter ? "Chantiers territorialisés" : null,
    statutLabel,
  ].filter((label): label is string => label !== null);
}

function alerteFilters(
  context: RapportDetailleContext,
  territoire: Territoire,
): string[] {
  const { alerteFilters: filters } = context;
  return [
    filters.estEnAlerteTauxAvancementNonCalculé
      ? "Taux d'avancement non calculé en raison d'indicateurs non renseignés"
      : null,
    filters.estEnAlerteÉcart
      ? `Chantier(s) avec un retard de 10 points par rapport à leur médiane ${territoire.maille}`
      : null,
    filters.estEnAlerteBaisse ? "Chantier(s) avec tendance en baisse" : null,
    filters.estEnAlerteMétéoNonRenseignée
      ? "Chantier(s) avec météo et synthèse des résultats non renseignés"
      : null,
    filters.estEnAlerteAbscenceTauxAvancementDepartemental
      ? "Chantier(s) sans taux d'avancement au niveau départemental"
      : null,
  ].filter((label): label is string => label !== null);
}

function simpleGroup(titre: string, labels: string[]): FilterGroup {
  return {
    titre,
    items: labels.map((label) => ({ text: label, fontSize: px(16) })),
    lineCount: labels.length,
  };
}

function filterGroupPdf(group: FilterGroup): Content {
  return {
    stack: [
      {
        text: group.titre,
        bold: true,
        fontSize: rem(1.3),
        lineHeight: cssLineHeight(28, 20.8),
        color: TITLE_COLOR,
      },
      {
        ul: group.items,
        margin: [rem(0.5), rem(0.25), 0, rem(1)],
        color: TEXT_COLOR,
      },
    ],
    unbreakable: true,
  };
}

function splitInColumns(groups: FilterGroup[]): [FilterGroup[], FilterGroup[]] {
  const first: FilterGroup[] = [];
  const second: FilterGroup[] = [];
  let height = 0;
  for (const group of groups) {
    height += (group.lineCount + 2) * FILTER_LINE_HEIGHT;
    (height <= FILTERS_COLUMN_MAX_HEIGHT ? first : second).push(group);
  }
  return [first, second];
}

export function pageDeGardePdf(params: {
  territoire: Territoire;
  context: RapportDetailleContext;
  ministères: Ministère[];
  axes: Axe[];
  estAutoriseAVoirLesBrouillons: boolean;
  now: Date;
}): Content {
  const { context, territoire } = params;
  const ministères = groupedPérimètres(
    params.ministères,
    context.filters.perimetres,
  );
  const axes = context.filters.axes
    .map((axeId) => params.axes.find((axe) => axe.id === axeId)?.nom)
    .filter((nom): nom is string => Boolean(nom));
  const typologies = typologieFilters(
    context,
    params.estAutoriseAVoirLesBrouillons,
  );
  const alertes = alerteFilters(context, territoire);

  const groups: FilterGroup[] = [
    simpleGroup("Territoire sélectionné", [territoire.nomAffiché]),
  ];
  if (ministères.length > 0) {
    groups.push({
      titre: "Ministère(s) ou périmètre(s) ministériel(s) sélectionné(s)",
      items: ministères.map((ministère) => ({
        stack: [
          { text: ministère.nom, bold: true, fontSize: px(16) },
          {
            stack: ministère.périmètres.map((nom) => ({
              text: nom,
              fontSize: px(16),
            })),
            margin: [rem(1.25), 0, 0, rem(0.25)],
          },
        ],
      })),
      lineCount: ministères.reduce(
        (total, ministère) => total + 1 + ministère.périmètres.length,
        0,
      ),
    });
  }
  if (typologies.length > 0) {
    groups.push(simpleGroup("Type(s) de chantier sélectionné(s)", typologies));
  }
  if (axes.length > 0) groups.push(simpleGroup("Axe(s)", axes));
  if (alertes.length > 0) {
    groups.push(simpleGroup("Alerte(s) sélectionnée(s)", alertes));
  }
  const [firstColumn, secondColumn] = splitInColumns(groups);
  const generatedAt = formatParisDate(params.now, "DD/MM/YYYY [à] H[h]mm");

  return {
    stack: [
      {
        columns: [
          {
            width: "auto",
            stack: [
              { svg: DRAPEAU_SVG, width: rem(2.75) },
              {
                text: "GOUVERNEMENT",
                bold: true,
                fontSize: rem(1.05),
                color: TEXT_COLOR,
                margin: [0, px(4), 0, px(4)],
              },
              { svg: DEVISE_SVG, width: rem(2.625) },
            ],
          },
          {
            width: "*",
            margin: [rem(2.5), rem(0.5), 0, 0],
            stack: [
              {
                text: "PILOTE",
                bold: true,
                fontSize: px(20),
                lineHeight: cssLineHeight(32, 20),
              },
              {
                text: "Piloter l'action publique par les résultats",
                fontSize: px(16),
              },
            ],
          },
        ],
        margin: [rem(6), 0, rem(6), rem(3)],
      },
      {
        table: {
          widths: ["*"],
          body: [
            [
              {
                fillColor: TITLE_BAND_BACKGROUND,
                margin: [0, rem(3), 0, rem(1.5)],
                stack: [
                  {
                    text: [
                      "État des lieux de l'avancement\n",
                      "des politiques prioritaires\n",
                      "du Gouvernement",
                    ],
                    bold: true,
                    fontSize: rem(4),
                    lineHeight: cssLineHeight(4.5, 4),
                    alignment: "center",
                    color: TITLE_COLOR,
                    margin: [0, 0, 0, rem(3)],
                  },
                  {
                    text: `Rapport détaillé généré le ${generatedAt}`,
                    fontSize: px(16),
                    color: TEXT_COLOR,
                    margin: [rem(6), 0, rem(6), 0],
                  },
                ],
              },
            ],
          ],
        },
        layout: "noBorders",
      },
      {
        columns: [
          { width: "*", stack: firstColumn.map(filterGroupPdf) },
          { width: "*", stack: secondColumn.map(filterGroupPdf) },
        ],
        columnGap: rem(2),
        margin: [rem(6), rem(2), rem(6), rem(2)],
      },
    ],
    pageBreak: "after",
  };
}
