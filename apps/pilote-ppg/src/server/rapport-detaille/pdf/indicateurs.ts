import { Content, ContentText } from "pdfmake/interfaces";
import { Dashboard31Icon } from "@/components/_commons/Icones/Dashboard31Icon";
import { DecroissanceIcon } from "@/components/_commons/Icones/DecroissanceIcon";
import { comparerIndicateur } from "@/client/utils/indicateur/indicateur";
import {
  CategoriesIndicateur,
  listeRubriquesIndicateursChantier,
} from "@/client/utils/rubriques";
import { convertitEnPondération } from "@/client/utils/ponderation/ponderation";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import {
  DétailsIndicateur,
  DétailsIndicateurs,
} from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import {
  alertePdf,
  barreDeProgressionPdf,
  blocPdf,
  MENTION_COLOR,
  PRIMARY_COLOR,
  tablePdf,
  TEXT_COLOR,
} from "@/server/pdf/primitives";
import { iconSvg } from "@/server/pdf/svgFromComponent";
import { px, rem } from "@/server/pdf/units";
import { RapportDetailleContext } from "@/server/rapport-detaille/rapportDetailleContext";
import { section } from "@/server/rapport-detaille/pdf/section";
import { findTerritoire } from "@/server/rapport-detaille/pdf/avancement";
import { formatParisDate } from "@/server/rapport-detaille/pdf/layout";

const MAILLE_ADJECTIVES = {
  NAT: "national",
  DEPT: "départemental",
  REG: "régional",
};
const CELL_PADDING: [number, number] = [px(8), px(16)];
const AVANCEMENT_COLUMN_WIDTH = rem(11);

function indicateurTitle(indicateur: Indicateur): string {
  return (
    indicateur.nom +
    (indicateur.unité === null || indicateur.unité === ""
      ? ""
      : ` (en ${indicateur.unité.toLocaleLowerCase()})`)
  );
}

function pondérationText(
  pondération: number | null,
  territoireCode: string,
): ContentText {
  const adjective =
    MAILLE_ADJECTIVES[territoireCodeVersMailleCodeInsee(territoireCode).maille];
  const text =
    pondération === null
      ? `La pondération n'est pas disponible pour le taux d'avancement ${adjective}.`
      : pondération === 0
        ? `Cet indicateur n'est pas pris en compte dans le taux d'avancement ${adjective} du chantier.`
        : [
            "Cet indicateur représente ",
            { text: `${convertitEnPondération(pondération)}%`, bold: true },
            ` du taux d'avancement ${adjective} du chantier.`,
          ];
  return { text, fontSize: px(16), color: MENTION_COLOR };
}

function valeurEtDate(
  valeur: number | null,
  date: string | null,
  unité: string | null,
): Content {
  const formattedDate = formatParisDate(date, "MM/YYYY");
  return {
    stack: [
      {
        text:
          valeur !== null && valeur !== undefined
            ? valeur.toLocaleString("fr-FR") +
              (unité?.toLocaleLowerCase() === "pourcentage" ? " %" : "")
            : "",
        fontSize: px(14),
        color: TEXT_COLOR,
      },
      ...(formattedDate
        ? [
            {
              text: `(${formattedDate})`,
              fontSize: px(10),
              color: MENTION_COLOR,
            },
          ]
        : []),
    ],
  };
}

function indicateurBloc(
  indicateur: Indicateur,
  détails: DétailsIndicateur | undefined,
  context: RapportDetailleContext,
): Content {
  const territoire = findTerritoire(context.territoireCode);
  const dateImport =
    formatParisDate(détails?.dateImport, "DD/MM/YYYY") ?? "Non renseigné";
  const infos: Content[] = [
    {
      text: [
        "Dernière mise à jour de la valeur d'avancement pour le territoire : ",
        { text: dateImport, bold: true },
      ],
      fontSize: px(16),
      color: MENTION_COLOR,
    },
    pondérationText(détails?.ponderation ?? null, context.territoireCode),
  ];
  if (détails?.tendance === "BAISSE") {
    infos.push({
      columns: [
        { svg: iconSvg(DecroissanceIcon, PRIMARY_COLOR), width: px(24) },
        {
          width: "*",
          text: "Attention, cet indicateur a un objectif de baisse. La cible représente une valeur inférieure à la valeur initiale.",
          fontSize: px(16),
          color: MENTION_COLOR,
        },
      ],
      columnGap: px(8),
      margin: [rem(1), px(4), 0, 0],
    });
  }
  const title: Content = {
    text: indicateurTitle(indicateur),
    bold: true,
    fontSize: px(20),
    lineHeight: 32 / 20,
    color: TEXT_COLOR,
  };
  return {
    stack: [
      blocPdf({
        content: {
          stack: [
            indicateur.estIndicateurDuBaromètre
              ? {
                  columns: [
                    {
                      svg: iconSvg(Dashboard31Icon, PRIMARY_COLOR),
                      width: px(24),
                      margin: [0, px(4), 0, 0],
                    },
                    { ...title, width: "*" },
                  ],
                  columnGap: px(8),
                }
              : title,
            { stack: infos, margin: [rem(1), px(8), 0, rem(1.5)] },
            tablePdf({
              headers: [
                "Territoire(s)",
                "Valeur initiale",
                "Valeur actuelle",
                `Cible ${context.jalon}`,
                `Avancement ${context.jalon}`,
              ],
              widths: ["*", "*", "*", "*", AVANCEMENT_COLUMN_WIDTH],
              cellPadding: CELL_PADDING,
              rows: [
                [
                  {
                    text: territoire?.nomAffiché ?? "",
                    fontSize: px(14),
                    color: TEXT_COLOR,
                  },
                  valeurEtDate(
                    détails?.valeurInitiale ?? null,
                    détails?.dateValeurInitiale ?? null,
                    détails?.unite ?? null,
                  ),
                  valeurEtDate(
                    détails?.valeurAvancement ?? null,
                    détails?.dateValeurAvancement ?? null,
                    détails?.unite ?? null,
                  ),
                  valeurEtDate(
                    détails?.valeurCibleAnnuelle ?? null,
                    détails?.dateValeurCibleAnnuelle ?? null,
                    détails?.unite ?? null,
                  ),
                  barreDeProgressionPdf({
                    valeur: détails?.avancement.annuel ?? null,
                    size: "md",
                    background: "gris-clair",
                    fill: "#666666",
                    label: "top",
                    width: AVANCEMENT_COLUMN_WIDTH - 2 * CELL_PADDING[1],
                  }),
                ],
              ],
            }),
          ],
        },
      }),
    ],
    margin: [0, 0, 0, rem(1)],
    unbreakable: true,
  };
}

export function indicateursPdf(params: {
  indicateurs: Indicateur[];
  détailsIndicateurs: DétailsIndicateurs;
  listeIndicateursPrisEnCompteAvancement: string[];
  context: RapportDetailleContext;
  hideNonApplicable: boolean;
}): Content | null {
  const { indicateurs, détailsIndicateurs, context } = params;
  if (indicateurs.length === 0) return null;
  const { territoireCode } = context;
  const applicables = params.hideNonApplicable
    ? indicateurs.filter(
        (indicateur) =>
          détailsIndicateurs[indicateur.id]?.[territoireCode]?.estApplicable ===
          true,
      )
    : indicateurs;

  if (applicables.length === 0) {
    return section(
      "Indicateurs",
      alertePdf({
        type: "info",
        titre:
          "Aucun indicateur n'est applicable pour le territoire sélectionné",
      }),
    );
  }

  const byCategory: Record<CategoriesIndicateur, Indicateur[]> = {
    participation_ta: [],
    non_participation_ta: [],
    autre: [],
  };
  for (const indicateur of applicables) {
    if (
      (détailsIndicateurs[indicateur.id]?.[territoireCode]?.ponderation ?? 0) >
      0
    ) {
      byCategory.participation_ta.push(indicateur);
    } else if (
      params.listeIndicateursPrisEnCompteAvancement.includes(indicateur.id)
    ) {
      byCategory.non_participation_ta.push(indicateur);
    } else {
      byCategory.autre.push(indicateur);
    }
  }

  const codeInsee = territoireCode.split("-")[1];
  const rubriques: Content[] = listeRubriquesIndicateursChantier
    .filter((rubrique) => byCategory[rubrique.categorieIndicateur].length > 0)
    .map((rubrique) => {
      const indicateursRubrique = byCategory[
        rubrique.categorieIndicateur
      ].toSorted((a, b) =>
        comparerIndicateur(
          a,
          b,
          détailsIndicateurs[a.id]?.[codeInsee]?.ponderation ?? null,
          détailsIndicateurs[b.id]?.[codeInsee]?.ponderation ?? null,
        ),
      );
      return {
        stack: [
          {
            text: `${rubrique.nom} (${indicateursRubrique.length})`,
            fontSize: px(18),
            lineHeight: 28 / 18,
            color: TEXT_COLOR,
            margin: [0, 0, 0, px(8)],
          },
          ...indicateursRubrique.map((indicateur) =>
            indicateurBloc(
              indicateur,
              détailsIndicateurs[indicateur.id]?.[territoireCode],
              context,
            ),
          ),
        ],
        margin: [0, 0, 0, rem(1.5)],
      };
    });

  return section("Indicateurs", { stack: rubriques }, { breakable: true });
}
