import { Content } from "pdfmake/interfaces";
import { InformationPleineIcon } from "@/components/_commons/Icones/InformationPleineIcon";
import { WarningIcon } from "@/components/_commons/Icones/WarningIcon";
import { ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieAvancement";
import { getAvancementLegend } from "@/components/_commons/Cartographie/CartographieAvancement/avancementFill";
import { libellesMeteos } from "@/server/domain/météo/Météo.interface";
import { TypeAlerteChantier } from "@/server/chantiers/app/contrats/TypeAlerteChantier";
import {
  blocPdf,
  encartPdf,
  PRIMARY_COLOR,
  separatorPdf,
  TEXT_COLOR,
} from "@/server/pdf/primitives";
import { iconSvg, meteoPictoSvg } from "@/server/pdf/svgFromComponent";
import { px, rem } from "@/server/pdf/units";
import { RapportDetailleContext } from "@/server/rapport-detaille/rapportDetailleContext";
import { VueDEnsembleRapportDetaille } from "@/server/rapport-detaille/rapportDetaille.interface";
import {
  avancementCarteSvg,
  cartographieLegendPdf,
} from "@/server/rapport-detaille/pdf/cartographie";
import { chantiersTablePdf } from "@/server/rapport-detaille/pdf/chantiersTable";
import { jaugePdf } from "@/server/rapport-detaille/pdf/jauges";
import { withoutMailles } from "@/server/rapport-detaille/withoutMailles";
import { CONTENT_WIDTH, GRID_GAP } from "@/server/rapport-detaille/pdf/layout";

const WARNING_COLOR = "#B34000";
const WARNING_BACKGROUND = "#FFE9E6";
const CARD_BORDER = "#E5E5E5";
const ALERTE_BORDER = "#DDDDDD";
const METEOS = ["ORAGE", "NUAGE", "COUVERT", "SOLEIL"] as const;
const HALF_WIDTH = (CONTENT_WIDTH - GRID_GAP) / 2;

export function titleWithInfoPdf(
  text: string,
  options: { color?: string; iconColor?: string; bold?: boolean } = {},
): Content {
  return {
    columns: [
      {
        width: "auto",
        text,
        fontSize: px(18),
        lineHeight: 28 / 18,
        bold: options.bold ?? false,
        color: options.color ?? PRIMARY_COLOR,
      },
      {
        width: px(24),
        svg: iconSvg(InformationPleineIcon, options.iconColor ?? PRIMARY_COLOR),
        margin: [px(8), px(2), 0, 0],
      },
    ],
    margin: [0, 0, 0, px(16)],
  };
}

function avancementsPdf(
  vue: VueDEnsembleRapportDetaille,
  jalon: number,
): Content {
  const archived = vue.chantiersSontArchives;
  return {
    columns: [
      { width: "*", text: "" },
      {
        width: rem(10.5),
        stack: [
          jaugePdf({
            pourcentage: vue.moyenneTauxAvancementTerritoire,
            couleur: archived ? "gris" : "bleu",
            taille: "lg",
            libellé: `Taux d'avancement à échéance ${jalon}`,
          }),
        ],
      },
      ...(
        [
          ["Minimum", vue.avancementsAgrégés.minimum, "orange"],
          ["Médiane", vue.avancementsAgrégés.médiane, "violet"],
          ["Maximum", vue.avancementsAgrégés.maximum, "vert"],
        ] as const
      ).map(([libellé, pourcentage, couleur]) => ({
        width: "auto" as const,
        stack: [
          jaugePdf({
            pourcentage,
            couleur: archived ? "gris" : couleur,
            taille: "sm",
            libellé,
          }),
        ],
      })),
      { width: "*", text: "" },
    ],
    columnGap: rem(0.5),
  };
}

function meteoCardsPdf(
  vue: VueDEnsembleRapportDetaille,
  selectedMeteos: string[],
): Content {
  return {
    columns: METEOS.map((meteo) => ({
      width: "*",
      table: {
        widths: ["*"],
        body: [
          [
            {
              stack: [
                {
                  svg: meteoPictoSvg(meteo) ?? "",
                  width: px(40),
                  alignment: "center",
                },
                {
                  text: String(vue.repartitionMeteosChantiers[meteo]),
                  bold: true,
                  fontSize: rem(2.5),
                  lineHeight: 1.2,
                  color: PRIMARY_COLOR,
                  alignment: "center",
                },
                {
                  text: libellesMeteos[meteo],
                  fontSize: px(14),
                  color: TEXT_COLOR,
                  alignment: "center",
                },
              ],
              margin: [px(8), px(8), px(8), px(8)],
            },
          ],
        ],
      },
      layout: {
        hLineWidth: () => px(1),
        vLineWidth: () => px(1),
        hLineColor: () =>
          selectedMeteos.includes(meteo) ? PRIMARY_COLOR : CARD_BORDER,
        vLineColor: () =>
          selectedMeteos.includes(meteo) ? PRIMARY_COLOR : CARD_BORDER,
      },
    })),
    columnGap: px(8),
  };
}

type RemontéeAlerte = { libellé: string; critère: TypeAlerteChantier };

function remontéesAlertes(context: RapportDetailleContext): RemontéeAlerte[] {
  const communes: RemontéeAlerte[] = [
    {
      critère: "estEnAlerteMétéoNonRenseignée",
      libellé:
        "Chantier(s) avec météo et synthèse des résultats non renseignés",
    },
    {
      critère: "estEnAlertePossedePropositionsValeurAvancement",
      libellé: "Chantier(s) avec proposition(s) de valeur d'avancement",
    },
  ];
  if (context.chantierMaille === "nationale") {
    return [
      {
        critère: "estEnAlerteTauxAvancementNonCalculé",
        libellé:
          "Taux d'avancement non calculé(s) en raison d'indicateurs non renseignés",
      },
      {
        critère: "estEnAlerteAbscenceTauxAvancementDepartemental",
        libellé: "Chantier(s) sans taux d'avancement au niveau départemental",
      },
      ...communes,
    ];
  }
  return [
    {
      critère: "estEnAlerteÉcart",
      libellé: `Chantier(s) avec un retard de 10 points par rapport à leur médiane ${context.chantierMaille}`,
    },
    {
      critère: "estEnAlerteBaisse",
      libellé: "Chantier(s) avec tendance en baisse",
    },
    ...communes,
  ];
}

function chantiersSignalésPdf(
  vue: VueDEnsembleRapportDetaille,
  context: RapportDetailleContext,
): Content {
  return {
    stack: [
      {
        columns: [
          {
            width: "auto",
            table: {
              body: [
                [
                  {
                    svg: iconSvg(WarningIcon, WARNING_COLOR),
                    width: px(16),
                    fillColor: WARNING_BACKGROUND,
                  },
                ],
              ],
            },
            layout: {
              hLineWidth: () => 0,
              vLineWidth: () => 0,
              paddingLeft: () => px(4),
              paddingRight: () => px(4),
              paddingTop: () => px(2),
              paddingBottom: () => px(2),
            },
            margin: [0, px(4), px(8), 0],
          },
          {
            width: "*",
            stack: [
              titleWithInfoPdf("Chantiers signalés", {
                iconColor: WARNING_COLOR,
              }),
            ],
          },
        ],
      },
      {
        columns: remontéesAlertes(context).map((alerte) => {
          const activée = context.alerteFilters[alerte.critère];
          return {
            width: "*",
            table: {
              widths: ["*"],
              body: [
                [
                  {
                    stack: [
                      {
                        text: String(
                          vue.filtresComptesCalculés[alerte.critère] ?? "-",
                        ),
                        bold: true,
                        fontSize: rem(2.5),
                        lineHeight: 1.2,
                        color: WARNING_COLOR,
                      },
                      {
                        text: alerte.libellé,
                        fontSize: px(16),
                        color: TEXT_COLOR,
                      },
                    ],
                    margin: [rem(1.5), rem(1.5), rem(1.5), rem(1.5)],
                  },
                ],
              ],
            },
            layout: {
              hLineWidth: () => px(1),
              vLineWidth: () => px(1),
              hLineColor: () => (activée ? WARNING_COLOR : ALERTE_BORDER),
              vLineColor: () => (activée ? WARNING_COLOR : ALERTE_BORDER),
            },
          };
        }),
        columnGap: rem(1.5),
      },
    ],
    margin: [0, rem(1.5), 0, 0],
    unbreakable: true,
  };
}

export function vueDEnsemblePdf(
  vue: VueDEnsembleRapportDetaille,
  context: RapportDetailleContext,
): Content {
  const carte = avancementCarteSvg({
    territoireCode: context.territoireCode,
    selectedMaille: context.selectedMaille,
    données: vue.avancementsGlobauxTerritoriauxMoyens,
  });
  return {
    stack: [
      encartPdf("Vue d'ensemble"),
      {
        columns: [
          {
            width: HALF_WIDTH,
            stack: [
              blocPdf({
                content: {
                  stack: [
                    titleWithInfoPdf("Taux d'avancement moyen"),
                    avancementsPdf(vue, context.jalon),
                    separatorPdf([0, rem(1.5), 0, rem(1.5)]),
                    titleWithInfoPdf("Répartition des météos renseignées"),
                    meteoCardsPdf(vue, context.filters.meteos),
                  ],
                },
              }),
            ],
          },
          {
            width: HALF_WIDTH,
            stack: [
              blocPdf({
                content: {
                  stack: [
                    {
                      text: "Taux d'avancement des chantiers par territoire",
                      fontSize: px(18),
                      lineHeight: 28 / 18,
                      color: TEXT_COLOR,
                      margin: [0, 0, 0, px(8)],
                    },
                    { svg: carte, width: rem(25), alignment: "center" },
                    cartographieLegendPdf(
                      getAvancementLegend(
                        vue.avancementsGlobauxTerritoriauxMoyens,
                        ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS,
                      ),
                    ),
                  ],
                },
              }),
            ],
          },
        ],
        columnGap: GRID_GAP,
        margin: [0, rem(1.5), 0, 0],
        unbreakable: true,
      },
      ...(vue.chantiersSontArchives
        ? []
        : [chantiersSignalésPdf(vue, context)]),
      {
        stack: [
          blocPdf({
            breakable: true,
            content: {
              stack: [
                {
                  text: "Liste des chantiers",
                  fontSize: px(18),
                  lineHeight: 28 / 18,
                  color: PRIMARY_COLOR,
                  margin: [0, 0, 0, px(8)],
                },
                chantiersTablePdf(
                  vue.chantiers.map(withoutMailles),
                  vue.chantiersSontArchives,
                ),
              ],
            },
          }),
        ],
        margin: [0, rem(1.75), 0, 0],
      },
    ],
    pageBreak: "after",
  };
}
