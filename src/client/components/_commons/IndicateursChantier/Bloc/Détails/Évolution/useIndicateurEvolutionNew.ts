import type { LineSeriesOption } from "echarts/charts";
import { TopLevelFormatterParams } from "echarts/types/dist/shared";
import { ComposeOption } from "echarts/types/dist/echarts";
import { useEffect, useState } from "react";
import type { IndicateurDétailsParTerritoire } from "@/client/components/_commons/IndicateursChantier/Bloc/IndicateurBloc.interface";
import { formaterDate } from "@/client/utils/date/date";

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

export default function useIndicateurEvolutionNew({
  modeImpression,
  tousLesIndicateursDetails,
}: {
  modeImpression: boolean;
  tousLesIndicateursDetails: IndicateurDétailsParTerritoire[];
}) {
  const [afficherLesCibles, setAfficherLesCibles] = useState<boolean>(false);
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

  let minDate = new Date();
  let maxDate = new Date(0);
  tousLesIndicateursDetails.forEach((indicateur) => {
    indicateur.données.historiquesValeurs.forEach((valeur) => {
      const date = new Date(valeur.date);
      if (date < minDate) minDate = date;
      if (date > maxDate) maxDate = date;
    });
  });
  const minYear = new Date(minDate).getFullYear();
  const maxYear = maxDate.getFullYear();
  const maxDatePrev = new Date(maxDate);
  maxDate.setMonth(maxDate.getMonth() + 1);

  const periodesSelectionnablesZoom = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => (minYear + i).toString(),
  );
  periodesSelectionnablesZoom.unshift("Toute la période");
  const [periodeSelectionnee, setPeriodeSelectionnee] =
    useState<string>("Toute la période");
  const [dataZoomPeriode, setDataZoomPeriode] = useState<{
    startValue: Date;
    endValue: Date;
  }>({ startValue: minDate, endValue: maxDate });

  const changerLaPeriodeSelectionnee = (periode: string) => {
    setPeriodeSelectionnee(periode);
    if (periode === "Toute la période") {
      setDataZoomPeriode({
        startValue: minDate,
        endValue: maxDate,
      });
    } else {
      setDataZoomPeriode({
        startValue: new Date(`${periode}-01-01`),
        endValue: new Date(`${periode}-12-31`),
      });
    }
  };

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
    couleur: string,
  ): LineSeriesOption => ({
    name: indicateur.territoireNom,
    type: "line",
    symbol: "circle",
    showSymbol: true,
    color: couleur,
    data: territoiresAAfficher[indicateur.territoireNom]
      ? indicateur.données.historiquesValeurs.map((valeur) => {
          const date = new Date(valeur.date);
          date.setDate(15);
          return [date, valeur.valeur];
        })
      : undefined,
  });

  const creerSerieCibles = (
    indicateur: IndicateurDétailsParTerritoire,
    couleur: string,
  ): LineSeriesOption => ({
    name: `${indicateur.territoireNom} - Cible`,
    type: "line",
    symbol: "none",
    showSymbol: false,
    connectNulls: false,
    color: couleur,
    lineStyle: { type: "dashed", width: 2 },
    silent: true,
    data:
      afficherLesCibles && territoiresAAfficher[indicateur.territoireNom]
        ? indicateur.données.listeValeursCiblesAnnuelles.flatMap(
            (cibleAnnuelle) => {
              if (cibleAnnuelle.valeurCible === null) return [];

              const debutAnnee =
                new Date(`${cibleAnnuelle.annee}-01-01`) < minDate
                  ? minDate
                  : new Date(`${cibleAnnuelle.annee}-01-01`);

              const finAnnee =
                new Date(`${cibleAnnuelle.annee}-12-31`) > maxDate
                  ? maxDate
                  : new Date(`${cibleAnnuelle.annee}-12-31`);

              return [
                [debutAnnee, cibleAnnuelle.valeurCible],
                [finAnnee, cibleAnnuelle.valeurCible],
                null,
              ];
            },
          )
        : [],
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
      indicateur.données.listeValeursCiblesAnnuelles.forEach((cible) => {
        if (cible.valeurCible != null) {
          minValue = Math.min(minValue, cible.valeurCible);
          maxValue = Math.max(maxValue, cible.valeurCible);
        }
      });
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
            if (minYear === maxYear) {
              const moisDuMilieu = Math.ceil(
                (maxDatePrev.getMonth() + minDate.getMonth()) / 2,
              );
              return date.getMonth() === moisDuMilieu
                ? date.getFullYear().toString()
                : "";
            }
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
          if (value >= 1_000_000_000) {
            return (value / 1_000_000_000).toLocaleString("fr-FR") + " Md";
          } else if (value >= 1_000_000) {
            return (value / 1_000_000).toLocaleString("fr-FR") + " M";
          } else if (value >= 1000) {
            return (value / 1000).toLocaleString("fr-FR") + " k";
          }
          return value.toLocaleString("fr-FR");
        },
      },
    },
    dataZoom: modeImpression
      ? []
      : [
          {
            type: "slider",
            xAxisIndex: [0, 1, 2],
            height: 25,
            bottom: 10,
            filterMode: "none",
            labelFormatter: function (value: string) {
              const date = new Date(value);
              return formaterDate(date.toISOString(), "MM/YYYY");
            },
            textStyle: {
              fontSize: 10,
              overflow: "breakAll",
            },
            startValue: dataZoomPeriode.startValue,
            endValue: dataZoomPeriode.endValue,
          },
        ],
    grid: {
      left: 25,
      right: 60,
      top: 10,
      bottom: 60,
      outerBoundsMode: "same",
      outerBoundsContain: "axisLabel",
    },
    series: [
      ...tousLesIndicateursDetails.flatMap((indicateurDetail, index) => {
        const couleur = PALETTE_DSFR[index % PALETTE_DSFR.length];
        return [
          creerSerie(indicateurDetail, couleur),
          creerSerieCibles(indicateurDetail, couleur),
        ];
      }),
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
    periodesSelectionnablesZoom,
    changerLaPeriodeSelectionnee,
    periodeSelectionnee,
  };
}
