import {
  Fragment,
  FunctionComponent,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { SelectField } from "@/components/shared/SelectField";
import * as echarts from "echarts";
import type {
  Granularite,
  StatistiquesLogs,
} from "@/server/application-log/queries/ObtenirStatistiquesLogsQuery";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import { libelleCategorieLog } from "@/utils/categoriesLog";
import { type Periode, useGraphesLogs } from "./useGraphesLogs";

// Valeurs hex issues du tailwind.config.js (ECharts canvas ne supporte pas les CSS variables)
const COULEURS = {
  error: "#CE0500",
  warn: "#B34000",
  info: "#000091",
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
          <SelectField<Periode>
            label="Période"
            name="periode-graphes"
            onChange={handleSetPeriode}
            options={[
              { valeur: "7j", libelle: "7 jours" },
              { valeur: "30j", libelle: "30 jours" },
            ]}
            value={periode}
          />
        </div>
        <div>
          <SelectField<Granularite>
            label="Granularité"
            name="granularite-graphes"
            onChange={setGranularite}
            options={[
              { valeur: "heure", libelle: "Heure" },
              { valeur: "jour", libelle: "Jour" },
              { valeur: "semaine", libelle: "Semaine" },
            ]}
            value={granularite}
          />
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
      yAxis: {
        type: "category",
        data: sorted.map((entry) => libelleCategorieLog(entry.categorie)),
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
  }, [statistiques, ref]);
}
