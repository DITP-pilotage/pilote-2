import { Content } from "pdfmake/interfaces";
import { territoires as allTerritoires } from "@/client/constants/territoires.json";
import { Maille } from "@/shared/maille/Maille.interface";
import {
  BlocParams,
  blocRowPdf,
  PRIMARY_COLOR,
  separatorPdf,
  TEXT_COLOR,
} from "@/server/pdf/primitives";
import { px, rem } from "@/server/pdf/units";
import { RapportDetailleContext } from "@/server/rapport-detaille/rapportDetailleContext";
import {
  ChantierRapportDetailleWithoutMailles,
  ChantierDetail,
} from "@/server/rapport-detaille/rapportDetaille.interface";
import {
  ecartBadgePdf,
  tendanceBadgePdf,
} from "@/server/rapport-detaille/pdf/badges";
import { jaugePdf, jaugeSmallPdf } from "@/server/rapport-detaille/pdf/jauges";
import {
  CONTENT_WIDTH,
  formatParisDate,
} from "@/server/rapport-detaille/pdf/layout";

const BLOC_GAP = rem(0.7);
const COMPARAISON_YEAR = 2026;

const ECART_TERRITOIRES: Partial<Record<Maille, string>> = {
  departementale: " départements ",
  regionale: " régions ",
};

const TENDANCE_TERRITOIRE: Record<Maille, string> = {
  nationale: "le territoire",
  departementale: "le département",
  regionale: "la région",
};

export function findTerritoire(code: string | null) {
  return allTerritoires.find((territoire) => territoire.code === code) ?? null;
}

function centered(
  text: Content[] | string,
  options: Partial<{
    bold: boolean;
    fontSize: number;
    color: string;
    margin: [number, number, number, number];
  }> = {},
): Content {
  return {
    text,
    alignment: "center",
    fontSize: options.fontSize ?? px(16),
    bold: options.bold ?? false,
    color: options.color ?? TEXT_COLOR,
    margin: options.margin ?? [0, 0, 0, 0],
  };
}

function titleWithJalon(titre: string, jalon: number | string): Content {
  return centered([{ text: titre, bold: true }, ` ${jalon}`]);
}

function centeredBadge(badge: Content | null): Content {
  return badge
    ? {
        columns: [
          { width: "*", text: "" },
          { width: "auto", stack: [badge] },
          { width: "*", text: "" },
        ],
      }
    : { text: "" };
}

function territoireJaugeBloc(params: {
  titre: string;
  tauxTitre: string;
  jalon: number;
  moyenne: number | null;
  date: string | null;
  couleur: "bleu" | "bleu-clair";
  libellé: string;
}): BlocParams {
  return {
    titre: params.titre,
    content: {
      stack: [
        titleWithJalon(params.tauxTitre, params.jalon),
        jaugePdf({
          pourcentage: params.moyenne,
          couleur: params.couleur,
          taille: "lg",
          libellé: params.libellé,
          date: params.date,
        }),
      ],
      margin: [0, px(8), 0, px(8)],
    },
  };
}

function répartitionBloc(
  detail: ChantierDetail,
  context: RapportDetailleContext,
): BlocParams {
  const { global } = detail.avancement.nationale;
  return {
    titre: `Répartition territoriale du taux d'avancement ${context.jalon}`,
    withInfo: true,
    content: {
      stack: [
        titleWithJalon(
          context.selectedMaille === "regionale"
            ? "Répartition régionale"
            : "Répartition départementale",
          context.jalon,
        ),
        {
          margin: [rem(1), px(8), 0, 0],
          stack: [
            jaugeSmallPdf({
              pourcentage: global.maximum,
              couleur: "vert",
              libellé: "Maximum",
            }),
            jaugeSmallPdf({
              pourcentage: global.médiane,
              couleur: "violet",
              libellé: "Médiane",
            }),
            jaugeSmallPdf({
              pourcentage: global.minimum,
              couleur: "orange",
              libellé: "Minimum",
            }),
          ],
        },
      ],
    },
  };
}

function comparaisonBloc(
  chantier: ChantierRapportDetailleWithoutMailles,
  detail: ChantierDetail,
  context: RapportDetailleContext,
  territoireMaille: Maille,
): BlocParams {
  const content: Content[] = [];
  const ecartTerritoires = ECART_TERRITOIRES[territoireMaille] ?? "";
  if (context.territoireCode !== "NAT-FR") {
    const médiane = detail.avancement.nationale.global.médiane;
    content.push(
      centered([
        {
          text: `SITUATION PAR RAPPORT AUX AUTRES ${ecartTerritoires.toLocaleUpperCase("fr-FR").trim()}`,
          bold: true,
        },
      ]),
      centered(String(context.jalon), { margin: [0, 0, 0, px(8)] }),
      centeredBadge(ecartBadgePdf(chantier.ecart, { withLabel: true })),
      centered(
        [
          { text: "écart ", bold: true },
          `du taux d'avancement ${context.jalon} par rapport au taux médian des autres${ecartTerritoires}(`,
          {
            text: médiane ? `${médiane.toFixed(0)}%` : "Non défini",
            bold: true,
            color: "#8585F6",
          },
          ")",
        ],
        { margin: [0, px(8), 0, 0] },
      ),
      separatorPdf([0, px(12), 0, px(12)]),
    );
  }
  const date = formatParisDate(
    chantier.dateTauxAvancementMandatValeurPrecedente,
    "MM/YYYY",
  );
  content.push(
    centered([{ text: "EVOLUTION TEMPORELLE", bold: true }]),
    centered(String(COMPARAISON_YEAR), { margin: [0, 0, 0, px(8)] }),
    centeredBadge(tendanceBadgePdf(chantier.tendance)),
    centered(
      [
        { text: "tendance ", bold: true },
        `du taux d'avancement ${COMPARAISON_YEAR} par rapport au taux d'avancement précédemment mesuré sur ${TENDANCE_TERRITOIRE[territoireMaille]}`,
      ],
      { margin: [0, px(8), 0, 0] },
    ),
    chantier.avancementPrecedent !== null && date
      ? centered([
          "( ",
          {
            text: `${chantier.avancementPrecedent.toFixed(0)}%`,
            bold: true,
            color: PRIMARY_COLOR,
          },
          ", ",
          { text: date, color: "#666666" },
          " )",
        ])
      : centered("(Non défini)", { bold: true, color: PRIMARY_COLOR }),
  );
  return {
    titre: `Données de comparaison de l'avancement ${COMPARAISON_YEAR}`,
    withInfo: true,
    content: { stack: content },
  };
}

function grid(blocs: BlocParams[], columns: number): Content {
  const rows: Content[] = [];
  for (let index = 0; index < blocs.length; index += columns) {
    rows.push({
      stack: [
        blocRowPdf(blocs.slice(index, index + columns), {
          columns,
          width: CONTENT_WIDTH,
          gap: BLOC_GAP,
        }),
      ],
      margin: [0, 0, 0, BLOC_GAP],
    });
  }
  return { stack: rows };
}

export function avancementPdf(params: {
  chantier: ChantierRapportDetailleWithoutMailles;
  detail: ChantierDetail;
  context: RapportDetailleContext;
}): Content {
  const { chantier, detail, context } = params;
  const territoire = findTerritoire(context.territoireCode);
  const parent = findTerritoire(territoire?.codeParent ?? null);
  const territoireMaille: Maille =
    territoire?.maille === "regionale" ||
    territoire?.maille === "departementale"
      ? territoire.maille
      : "nationale";
  const isNational = context.territoireCode === "NAT-FR";
  const blocs: BlocParams[] = [];

  if (
    !isNational &&
    context.selectedMaille === "departementale" &&
    territoire
  ) {
    blocs.push(
      territoireJaugeBloc({
        titre: territoire.nomAffiché,
        tauxTitre: "Taux d'avancement départemental",
        jalon: context.jalon,
        moyenne: detail.avancement.departementale.annuel.moyenne,
        date: detail.avancement.departementale.annuel.date,
        couleur: "bleu",
        libellé: territoire.nom,
      }),
    );
  }
  if (!isNational && territoire) {
    const région = parent ?? territoire;
    blocs.push(
      territoireJaugeBloc({
        titre: région.nomAffiché,
        tauxTitre: "Taux d'avancement régional",
        jalon: context.jalon,
        moyenne: detail.avancement.regionale.annuel.moyenne,
        date: detail.avancement.regionale.annuel.date,
        couleur: context.selectedMaille === "regionale" ? "bleu" : "bleu-clair",
        libellé: région.nomAffiché,
      }),
    );
  }
  blocs.push(
    territoireJaugeBloc({
      titre: "France",
      tauxTitre: "Taux d'avancement national",
      jalon: context.jalon,
      moyenne: detail.avancement.nationale.annuel.moyenne,
      date: detail.avancement.nationale.annuel.date,
      couleur: isNational ? "bleu" : "bleu-clair",
      libellé: "France",
    }),
    répartitionBloc(detail, context),
    comparaisonBloc(chantier, detail, context, territoireMaille),
  );
  const columns = territoireMaille === "departementale" ? 3 : 2;
  return grid(blocs, columns);
}
