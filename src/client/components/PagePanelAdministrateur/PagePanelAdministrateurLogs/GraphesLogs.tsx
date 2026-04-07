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
  const { statistiques, periode, setPeriode, granularite, setGranularite } =
    useGraphesLogs();

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

  return (
    <div>
      {/* Filtres */}
      <div className="flex gap-4 mb-6">
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="periode-graphes"
          >
            Période
          </label>
          <select
            className="px-3 py-2 border border-gray-300 rounded text-sm bg-white"
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
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="granularite-graphes"
          >
            Granularité
          </label>
          <select
            className="px-3 py-2 border border-gray-300 rounded text-sm bg-white"
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

      {/* Timeline stacked bar */}
      <h3 className="text-base font-semibold text-gray-800 mb-2">
        Timeline des logs par niveau
      </h3>
      <div
        className="w-full h-[360px]"
        ref={timelineRef}
      />

      {/* Donut + Bar horizontal */}
      <div className="grid grid-cols-2 gap-6 mt-8">
        <div>
          <h3 className="text-base font-semibold text-gray-800 mb-2">
            Répartition par niveau
          </h3>
          <div
            className="w-full h-[300px]"
            ref={donutRef}
          />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-800 mb-2">
            Répartition par catégorie
          </h3>
          <div
            className="w-full h-[300px]"
            ref={barRef}
          />
        </div>
      </div>
    </div>
  );
};
