import type { LineSeriesOption } from "echarts/charts";
import { TopLevelFormatterParams } from "echarts/types/dist/shared";
import { ComposeOption } from "echarts/types/dist/echarts";
import type { IndicateurDétailsParTerritoire } from "@/client/components/_commons/IndicateursChantier/Bloc/IndicateurBloc.interface";

export type ECOption = ComposeOption<LineSeriesOption>;

export default function useIndicateurEvolutionNew(
  indicateurDetailsParTerritoires: IndicateurDétailsParTerritoire[],
) {
  const PALETTE_DSFR = [
    "#68A532",
    "#A558A0",
    "#417DC4",
    "#C8AA39",
    "#009081",
    "#E18B76",
    "#465F9D",
    "#C08C65",
    "#00A95F",
    "#E4794A",
    "#0078F3",
    "#D1B781",
    "#1F8D49",
    "#CE614A",
    "#009099",
    "#AEA397",
  ];

  const indicateurDetailTerritoireReference =
    indicateurDetailsParTerritoires[0];

  const minDate = new Date(
    indicateurDetailTerritoireReference.données.historiquesValeurs[0].date,
  );
  const maxDate = new Date(
    indicateurDetailTerritoireReference.données.historiquesValeurs[
      indicateurDetailTerritoireReference.données.historiquesValeurs.length - 1
    ].date,
  );
  maxDate.setMonth(maxDate.getMonth() + 1);
  const minYear = new Date(minDate).getFullYear();
  const maxYear = maxDate.getFullYear();

  const yMax = Math.max(
    ...indicateurDetailTerritoireReference.données.historiquesValeurs.map(
      (valeur) => valeur.valeur,
    ),
    indicateurDetailTerritoireReference.données.valeurCible ?? 0,
  );

  const genererFondAnnees = (startYear: number, endYear: number) => {
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => {
      const year = startYear + i;
      return [
        {
          xAxis: `${year}-01-01`,
          itemStyle: {
            color:
              year % 2 === 0 ? "rgba(0, 0, 0, 0)" : "rgba(229, 229, 229, 0.4)",
          },
        },
        {
          xAxis: `${year + 1}-01-01`,
        },
      ];
    });
  };

  const creerSerie = (
    indicateur: IndicateurDétailsParTerritoire,
  ): LineSeriesOption => ({
    name: indicateur.territoireNom,
    type: "line",
    symbol: "circle",
    showSymbol: true,
    data: indicateur.données.historiquesValeurs.map((valeur) => {
      const date = new Date(valeur.date);
      date.setDate(15);
      return [date, valeur.valeur];
    }),
    markLine: {
      symbol: "none",
      lineStyle: { type: "dashed" as const, width: 2 },
      silent: true,
      data: [
        [
          {
            coord: indicateur.données.valeurCible
              ? [minDate, indicateur.données.valeurCible]
              : [],
          },
          {
            coord: indicateur.données.valeurCible
              ? [maxDate, indicateur.données.valeurCible]
              : [],
          },
        ],
      ],
    },
  });

  const formatterLaTooltip = (parametres: TopLevelFormatterParams): string => {
    const dataParametres = Array.isArray(parametres)
      ? parametres
      : [parametres];
    const date = new Date(
      dataParametres[0].value
        ? ((Array.isArray(dataParametres[0].value)
            ? dataParametres[0].value[0]
            : dataParametres[0].value) as string)
        : "",
    );
    const mois = (date.getMonth() + 1).toString().padStart(2, "0");
    const annee = date.getFullYear();
    const tooltipContent = dataParametres.map((parametre) => {
      if (
        parametre.seriesName &&
        Array.isArray(parametre.value) &&
        parametre.value[1] !== null &&
        parametre.value[1] !== undefined
      ) {
        return `${parametre.marker} ${parametre.seriesName}: ${parametre.value[1]}`;
      }
    });
    return [`${mois}/${annee}`, ...tooltipContent].join("<br/>");
  };

  const optionsNew: ECOption = {
    tooltip: {
      formatter: formatterLaTooltip,
    },
    legend: {
      data: [indicateurDetailTerritoireReference.territoireNom],
      bottom: 50,
      textStyle: { fontSize: 12 },
    },
    xAxis: [
      {
        type: "time",
        min: minDate,
        max: maxDate,
        axisLabel: {
          show: false,
        },
        splitLine: { show: true, z: 10 },
        minInterval: 30 * 24 * 60 * 60 * 1000,
        maxInterval: 30 * 24 * 60 * 60 * 1000,
      },
      {
        type: "time",
        position: "bottom",
        offset: 5,
        min: minDate,
        max: maxDate,
        scale: false,
        axisTick: {
          show: false,
          interval: 0,
        },
        axisLabel: {
          formatter: (value: string) => {
            const date = new Date(value);
            return date.getDate() === 15
              ? (date.getMonth() + 1).toString().padStart(2, "0")
              : "";
          },
        },
        axisLine: { show: false },
        minInterval: 24 * 60 * 60 * 1000,
        maxInterval: 24 * 60 * 60 * 1000,
      },
      {
        type: "time",
        position: "bottom",
        offset: 25,
        min: minDate,
        max: maxDate,
        scale: false,
        axisLabel: {
          formatter: (value: string) => {
            const date = new Date(value);
            return date.getMonth() === 6 ? date.getFullYear().toString() : "";
          },
          fontWeight: "bold",
          color: "#444",
        },
        axisTick: {
          show: false,
        },
        axisLine: { show: false },
      },
    ],
    yAxis: {
      type: "value",
      min: 0,
      max: Math.ceil(yMax * 1.1),
      splitLine: { show: true },
      axisLabel: {
        showMaxLabel: false,
      },
    },
    grid: {
      left: 0,
      right: 30,
      top: 10,
      bottom: 90,
      containLabel: true,
    },
    color: PALETTE_DSFR,
    series: [
      creerSerie(indicateurDetailTerritoireReference),
      {
        type: "line",
        markArea: {
          silent: true,
          data: genererFondAnnees(minYear, maxYear),
        },
      } as LineSeriesOption,
    ],
  };

  return { optionsNew };
}
