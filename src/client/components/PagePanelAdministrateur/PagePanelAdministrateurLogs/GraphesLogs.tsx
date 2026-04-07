import { FunctionComponent, useEffect, useRef } from "react";
import * as echarts from "echarts";
import { useGraphesLogs } from "./useGraphesLogs";
import type { Granularite } from "@/server/application-log/domain/ApplicationLogRepository.interface";

const COULEURS = {
  error: "#e3342f",
  warn: "#f6993f",
  info: "#3490dc",
};

export const GraphesLogs: FunctionComponent = () => {
  const {
    statistiques,
    isLoading,
    periode,
    setPeriode,
    granularite,
    setGranularite,
  } = useGraphesLogs();

  const timelineRef = useRef<HTMLDivElement>(null);
  const donutRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!statistiques || !timelineRef.current) return;

    const chart = echarts.init(timelineRef.current);
    const dates = statistiques.timeline.map((entry) =>
      new Date(entry.date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
      }),
    );

    chart.setOption({
      tooltip: { trigger: "axis" },
      legend: { data: ["ERROR", "WARN", "INFO"] },
      xAxis: { type: "category", data: dates },
      yAxis: { type: "value" },
      series: [
        {
          name: "ERROR",
          type: "bar",
          stack: "total",
          data: statistiques.timeline.map((entry) => entry.error),
          color: COULEURS.error,
        },
        {
          name: "WARN",
          type: "bar",
          stack: "total",
          data: statistiques.timeline.map((entry) => entry.warn),
          color: COULEURS.warn,
        },
        {
          name: "INFO",
          type: "bar",
          stack: "total",
          data: statistiques.timeline.map((entry) => entry.info),
          color: COULEURS.info,
        },
      ],
    });

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [statistiques]);

  useEffect(() => {
    if (!statistiques || !donutRef.current) return;

    const chart = echarts.init(donutRef.current);
    chart.setOption({
      tooltip: { trigger: "item" },
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          data: statistiques.parLevel.map((entry) => ({
            name: entry.level,
            value: entry.count,
            itemStyle: {
              color:
                COULEURS[
                  entry.level.toLowerCase() as keyof typeof COULEURS
                ] ?? "#888",
            },
          })),
          label: { formatter: "{b}: {d}%" },
        },
      ],
    });

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [statistiques]);

  useEffect(() => {
    if (!statistiques || !barRef.current) return;

    const chart = echarts.init(barRef.current);
    const sorted = [...statistiques.parCategorie].sort(
      (a, b) => a.count - b.count,
    );

    chart.setOption({
      tooltip: { trigger: "axis" },
      xAxis: { type: "value" },
      yAxis: {
        type: "category",
        data: sorted.map((entry) => entry.categorie),
      },
      series: [
        {
          type: "bar",
          data: sorted.map((entry) => entry.count),
          color: COULEURS.info,
        },
      ],
    });

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [statistiques]);

  if (isLoading) return <p>Chargement...</p>;

  return (
    <div>
      <div className="fr-grid-row fr-grid-row--gutters fr-mb-2w">
        <div className="fr-col-auto">
          <label
            className="fr-label"
            htmlFor="periode-graphes"
          >
            Période
          </label>
          <select
            className="fr-select"
            id="periode-graphes"
            onChange={(event) =>
              setPeriode(event.target.value as "7j" | "30j")
            }
            value={periode}
          >
            <option value="7j">7 jours</option>
            <option value="30j">30 jours</option>
          </select>
        </div>
        <div className="fr-col-auto">
          <label
            className="fr-label"
            htmlFor="granularite-graphes"
          >
            Granularité
          </label>
          <select
            className="fr-select"
            id="granularite-graphes"
            onChange={(event) =>
              setGranularite(event.target.value as Granularite)
            }
            value={granularite}
          >
            <option value="heure">Heure</option>
            <option value="jour">Jour</option>
            <option value="semaine">Semaine</option>
          </select>
        </div>
      </div>

      <h3 className="fr-h6">Timeline des logs par niveau</h3>
      <div
        ref={timelineRef}
        style={{ width: "100%", height: "360px" }}
      />

      <div className="fr-grid-row fr-grid-row--gutters fr-mt-4w">
        <div className="fr-col-6">
          <h3 className="fr-h6">Répartition par niveau</h3>
          <div
            ref={donutRef}
            style={{ width: "100%", height: "300px" }}
          />
        </div>
        <div className="fr-col-6">
          <h3 className="fr-h6">Répartition par catégorie</h3>
          <div
            ref={barRef}
            style={{ width: "100%", height: "300px" }}
          />
        </div>
      </div>
    </div>
  );
};
