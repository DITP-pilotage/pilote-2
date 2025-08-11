import type { LineSeriesOption } from "echarts/charts";
import { TopLevelFormatterParams } from "echarts/types/dist/shared";
import { ComposeOption } from "echarts/types/dist/echarts";
import { useEffect, useState } from "react";
import type { IndicateurDétailsParTerritoire } from "@/client/components/_commons/IndicateursChantier/Bloc/IndicateurBloc.interface";

export type ECOption = ComposeOption<LineSeriesOption>;
export const PALETTE_DSFR = [
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

export default function useIndicateurEvolutionNew(
  tousLesIndicateursDetails: IndicateurDétailsParTerritoire[],
) {
  const [afficherLesCibles, setAfficherLesCibles] = useState<boolean>(true);
  const [territoiresAAfficher, setTerritoiresAAfficher] = useState<
    Record<string, boolean>
  >(() =>
    tousLesIndicateursDetails.reduce<Record<string, boolean>>(
      (acc, indicateurDetail) => {
        acc[indicateurDetail.territoireNom] = true;
        return acc;
      },
      {},
    ),
  );

  useEffect(() => {
    const territoiresManquants = tousLesIndicateursDetails.filter(
      (indicateurDetails) =>
        !Object.keys(territoiresAAfficher).includes(
          indicateurDetails.territoireNom,
        ),
    );

    if (territoiresManquants.length > 0) {
      setTerritoiresAAfficher({
        ...territoiresAAfficher,
        [territoiresManquants[0].territoireNom]: true,
      });
    }
  }, [
    tousLesIndicateursDetails,
    territoiresAAfficher,
    setTerritoiresAAfficher,
  ]);

  const indicateurDetailTerritoireReference = tousLesIndicateursDetails[0];
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
    data: territoiresAAfficher[indicateur.territoireNom]
      ? indicateur.données.historiquesValeurs.map((valeur) => {
          const date = new Date(valeur.date);
          date.setDate(15);
          return [date, valeur.valeur];
        })
      : undefined,
    markLine:
      afficherLesCibles && territoiresAAfficher[indicateur.territoireNom]
        ? {
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
          }
        : undefined,
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
        return `${parametre.marker} ${parametre.seriesName}: ${parametre.value[1].toLocaleString("fr-FR")}`;
      }
    });
    return [`${mois}/${annee}`, ...tooltipContent].join("<br/>");
  };

  const CalculerBornesAxeY = () => {
    let minValue = Number.POSITIVE_INFINITY;
    let maxValue = Number.NEGATIVE_INFINITY;

    tousLesIndicateursDetails.forEach((indicateur) => {
      indicateur.données.historiquesValeurs.forEach((valeur) => {
        if (valeur.valeur != null) {
          minValue = Math.min(minValue, valeur.valeur);
          maxValue = Math.max(maxValue, valeur.valeur);
        }
      });
      if (indicateur.données.valeurCible) {
        minValue = Math.min(minValue, indicateur.données.valeurCible);
        maxValue = Math.max(maxValue, indicateur.données.valeurCible);
      }
    });

    if (minValue === Number.POSITIVE_INFINITY) minValue = 0;
    if (maxValue === Number.NEGATIVE_INFINITY) maxValue = 100;

    const margin = (maxValue - minValue) * 0.1;
    return {
      yMin: Math.min(0, minValue),
      yMax: maxValue + margin,
    };
  };

  const { yMin, yMax } = CalculerBornesAxeY();

  const optionsNew: ECOption = {
    tooltip: {
      formatter: formatterLaTooltip,
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
      min: yMin,
      max: yMax,
      splitLine: { show: true },
      axisLabel: {
        showMaxLabel: false,
        showMinLabel: false,
        formatter: function (value: number) {
          return value.toLocaleString("fr-FR");
        },
      },
    },
    grid: {
      left: 0,
      right: 30,
      top: 10,
      bottom: 15,
      containLabel: true,
    },
    color: PALETTE_DSFR,
    series: [
      ...tousLesIndicateursDetails.map((indicateurDetail) =>
        creerSerie(indicateurDetail),
      ),
      {
        type: "line",
        markArea: {
          silent: true,
          data: genererFondAnnees(minYear, maxYear),
        },
      } as LineSeriesOption,
    ],
  };

  return {
    afficherLesCibles,
    setAfficherLesCibles,
    territoiresAAfficher,
    setTerritoiresAAfficher,
    optionsNew,
  };
}
