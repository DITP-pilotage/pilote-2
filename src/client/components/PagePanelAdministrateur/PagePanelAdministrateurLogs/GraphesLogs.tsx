import {
  Fragment,
  FunctionComponent,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import * as echarts from "echarts";
import type {
  Granularite,
  StatistiquesLogs,
} from "@/server/application-log/domain/ApplicationLogRepository.interface";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import { type Periode, useGraphesLogs } from "./useGraphesLogs";

const COULEURS = {
  error: "var(--tw-color-error)",
  warn: "var(--tw-color-warning)",
  info: "var(--tw-color-primary)",
};

function calculerDateDebutISO(periode: Periode): string {
  const date = new Date();
  date.setDate(date.getDate() - (periode === "7j" ? 7 : 30));
  return date.toISOString();
}

export const GraphesLogs: FunctionComponent = () => {
  const [periode, setPeriode] = useState<Periode>("7j");
  const [granularite, setGranularite] = useState<Granularite>("jour");
  const [dateDebut, setDateDebut] = useState(() => calculerDateDebutISO("7j"));
  const [dateFin, setDateFin] = useState(() => new Date().toISOString());

  const handleSetPeriode = (newPeriode: Periode) => {
    setPeriode(newPeriode);
    setDateDebut(calculerDateDebutISO(newPeriode));
  };

  useEffect(() => {
    setDateFin(new Date().toISOString());
  }, [periode, granularite]);

  return (
    <Fragment>
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
              handleSetPeriode(event.target.value as Periode)
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

      <Suspense
        fallback={<p className="text-gray-500">Chargement des graphes...</p>}
      >
        <GraphesLogsContenu
          dateDebut={dateDebut}
          dateFin={dateFin}
          granularite={granularite}
        />
      </Suspense>
    </Fragment>
  );
};

const GraphesLogsContenu: FunctionComponent<{
  dateDebut: string;
  dateFin: string;
  granularite: Granularite;
}> = ({ dateDebut, dateFin, granularite }) => {
  const statistiques = useGraphesLogs({ dateDebut, dateFin, granularite });

  const timelineRef = useRef<HTMLDivElement>(null);
  const donutRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEchartsTimeline(timelineRef, statistiques);
  useEchartsDonut(donutRef, statistiques);
  useEchartsBarCategorie(barRef, statistiques);

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-2">
        Timeline des logs par niveau
      </h3>
      <div className="w-full h-[360px]" ref={timelineRef} />

      <div className="grid grid-cols-2 gap-6 mt-8">
        <div>
          <h3 className="text-base font-semibold text-gray-800 mb-2">
            Répartition par niveau
          </h3>
          <div className="w-full h-[300px]" ref={donutRef} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-800 mb-2">
            Répartition par catégorie
          </h3>
          <div className="w-full h-[300px]" ref={barRef} />
        </div>
      </div>
    </div>
  );
};

function useEchartsTimeline(
  ref: React.RefObject<HTMLDivElement | null>,
  statistiques: StatistiquesLogs,
) {
  useEffect(() => {
    if (!ref.current) return;

    const chart = echarts.init(ref.current);
    const { timeline } = statistiques;
    const dates = timeline.map((entry) =>
      PiloteDateFormatter.isoDateFranceMetropolitaine(
        new Date(entry.date).toISOString(),
      ),
    );

    chart.setOption({
      tooltip: { trigger: "axis" },
      legend: { data: ["ERROR", "WARN", "INFO"] },
      xAxis: { type: "category", data: dates },
      yAxis: { type: "value" },
      series: [
        {
          name: "ERROR",
          type: "line",
          smooth: true,
          data: timeline.map((entry) => entry.error),
          color: COULEURS.error,
        },
        {
          name: "WARN",
          type: "line",
          smooth: true,
          data: timeline.map((entry) => entry.warn),
          color: COULEURS.warn,
        },
        {
          name: "INFO",
          type: "line",
          smooth: true,
          data: timeline.map((entry) => entry.info),
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
  }, [statistiques, ref]);
}

function useEchartsDonut(
  ref: React.RefObject<HTMLDivElement | null>,
  statistiques: StatistiquesLogs,
) {
  useEffect(() => {
    if (!ref.current) return;

    const chart = echarts.init(ref.current);
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
                COULEURS[entry.level.toLowerCase() as keyof typeof COULEURS] ??
                "#929292",
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
  }, [statistiques, ref]);
}

function useEchartsBarCategorie(
  ref: React.RefObject<HTMLDivElement | null>,
  statistiques: StatistiquesLogs,
) {
  useEffect(() => {
    if (!ref.current) return;

    const chart = echarts.init(ref.current);
    const sorted = [...statistiques.parCategorie]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    chart.setOption({
      tooltip: { trigger: "axis" },
      xAxis: { type: "value" },
      yAxis: { type: "category", data: sorted.map((entry) => entry.categorie) },
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
  }, [statistiques, ref]);
}
