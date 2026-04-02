import type { LineSeriesOption } from "echarts/charts";
import { TopLevelFormatterParams } from "echarts/types/dist/shared";
import { ComposeOption } from "echarts/types/dist/echarts";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formaterDate } from "@/client/utils/date/date";
import { getCouleurTerritoireParCode } from "@/client/utils/couleur/paletteTerritoires";
import type { ChartDisplayMode, TerritoireEvolutionDonnees } from "./types";

export type ECOption = ComposeOption<LineSeriesOption>;

export const formatMonthAxisLabel = (
  value: string,
  chartDisplayMode: ChartDisplayMode,
) => {
  if (chartDisplayMode === "compact") {
    return "";
  }

  const date = new Date(value);

  if (date.getDate() !== 15) {
    return "";
  }

  return (date.getMonth() + 1).toString().padStart(2, "0");
};

const creerSerie = (
  indicateur: TerritoireEvolutionDonnees,
  couleur: string,
  territoiresAAfficher: Record<string, boolean>,
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
  indicateur: TerritoireEvolutionDonnees,
  couleur: string,
  territoiresAAfficher: Record<string, boolean>,
  afficherLesCibles: boolean,
  minDate: Date,
  maxDate: Date,
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

export default function useIndicateurEvolutionNew({
  tousLesIndicateursDetails,
  jalon,
}: {
  tousLesIndicateursDetails: TerritoireEvolutionDonnees[];
  jalon?: number;
}) {
  const [afficherLesCibles, setAfficherLesCibles] = useState<boolean>(false);
  const [masquerSlider, setMasquerSlider] = useState<boolean>(false);
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

  const [minDate, maxDate] = useMemo(() => {
    let min = new Date();
    let max = new Date(0);
    tousLesIndicateursDetails.forEach((indicateur) => {
      indicateur.données.historiquesValeurs.forEach((valeur) => {
        const date = new Date(valeur.date);
        if (date < min) min = date;
        if (date > max) max = date;
      });
    });
    if (max < min) {
      const annee = jalon ?? new Date().getFullYear();
      min = new Date(`${annee}-01-01`);
      max = new Date(`${annee}-01-31`);
      setMasquerSlider(true);
    } else if (min === max) {
      setMasquerSlider(true);
    } else {
      setMasquerSlider(false);
    }
    const maxAreturn = new Date(max);
    maxAreturn.setMonth(maxAreturn.getMonth() + 1);
    return [min, maxAreturn];
  }, [jalon, tousLesIndicateursDetails]);

  const [minYear, maxYear] = useMemo(() => {
    return [new Date(minDate).getFullYear(), maxDate.getFullYear()];
  }, [minDate, maxDate]);

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

  const dateDuMilieuParAnnee = useMemo(() => {
    const result: Record<number, Date> = {};
    const debutAnnee = minDate.getFullYear();
    const finAnnee = maxDate.getFullYear();

    for (let year = debutAnnee; year <= finAnnee; year++) {
      const debutVisible =
        year === debutAnnee ? minDate : new Date(`${year}-01-01`);
      const finVisible =
        year === finAnnee ? maxDate : new Date(`${year}-12-31`);
      if (debutVisible.getTime() !== finVisible.getTime()) {
        const milieu = new Date(
          (debutVisible.getTime() + finVisible.getTime()) / 2,
        );
        result[year] = milieu;
      }
    }
    return result;
  }, [minDate, maxDate]);

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

  const getOptions = useCallback(
    ({
      modeImpression,
      chartDisplayMode,
    }: {
      modeImpression: boolean;
      chartDisplayMode: ChartDisplayMode;
    }) => ({
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
            formatter: (value: string) =>
              formatMonthAxisLabel(value, chartDisplayMode),
          },
          axisLine: { show: false },
          minInterval: 24 * 60 * 60 * 1000,
          maxInterval: 24 * 60 * 60 * 1000,
        },
        {
          type: "time",
          position: "bottom",
          offset: chartDisplayMode === "compact" ? 14 : 25,
          min: minDate,
          max: maxDate,
          scale: false,
          axisLabel: {
            formatter: (value: string) => {
              const date = new Date(value);
              const year = date.getFullYear();
              return date.toDateString() ===
                dateDuMilieuParAnnee[year]?.toDateString()
                ? year.toString()
                : "";
            },
            fontWeight: "bold",
            color: "#444",
          },
          axisTick: {
            show: false,
          },
          axisLine: { show: false },
          minInterval: 24 * 60 * 60 * 1000,
          maxInterval: 24 * 60 * 60 * 1000,
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
      dataZoom: masquerSlider
        ? undefined
        : [
            {
              type: "slider",
              xAxisIndex: [0, 1, 2],
              height: modeImpression ? 0 : 25,
              bottom: modeImpression ? -10 : 10,
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
        bottom: chartDisplayMode === "compact" ? 72 : 60,
        outerBoundsMode: "same",
        outerBoundsContain: "axisLabel",
      },
      series: [
        ...tousLesIndicateursDetails.flatMap((indicateurDetail) => {
          const couleur = getCouleurTerritoireParCode(indicateurDetail.territoireCode);
          return [
            creerSerie(indicateurDetail, couleur, territoiresAAfficher),
            creerSerieCibles(
              indicateurDetail,
              couleur,
              territoiresAAfficher,
              afficherLesCibles,
              minDate,
              maxDate,
            ),
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
    }),
    [
      afficherLesCibles,
      dataZoomPeriode.endValue,
      dataZoomPeriode.startValue,
      maxDate,
      dateDuMilieuParAnnee,
      maxYear,
      minDate,
      minYear,
      territoiresAAfficher,
      tousLesIndicateursDetails,
      yMax,
      yMin,
      masquerSlider,
    ],
  );
  return {
    afficherLesCibles,
    setAfficherLesCibles,
    territoiresAAfficher,
    setTerritoiresAAfficher,
    getOptions,
    periodesSelectionnablesZoom,
    changerLaPeriodeSelectionnee,
    periodeSelectionnee,
  };
}
