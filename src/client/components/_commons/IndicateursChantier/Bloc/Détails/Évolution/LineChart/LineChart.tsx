import {
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useEffect,
  useRef,
} from "react";
import * as echarts from "echarts";
import { ECOption } from "@/client/components/_commons/IndicateursChantier/Bloc/Détails/Évolution/useIndicateurEvolutionNew";
import type { TerritoireEvolutionDonnees } from "@/client/components/_commons/IndicateursChantier/Bloc/Détails/Évolution/types";
import LineChartLegende from "./LineChartLegende/LineChartLegende";

export interface LineChartProps {
  getOptions: (modeImpression: boolean) => ECOption;
  tousLesIndicateursDetails: TerritoireEvolutionDonnees[];
  territoiresAAfficher: Record<string, boolean>;
  setTerritoiresAAfficher: Dispatch<Record<string, boolean>>;
  afficherLesCibles: boolean;
  setAfficherLesCibles: Dispatch<SetStateAction<boolean>>;
  periodeSelectionnee: string;
  changerLaPeriodeSelectionnee: (periode: string) => void;
  periodesSelectionnablesZoom: string[];
  modeImpression?: boolean;
  afficherInterrupteurCibles?: boolean;
}

const LineChart: FunctionComponent<LineChartProps> = ({
  getOptions,
  tousLesIndicateursDetails,
  territoiresAAfficher,
  setTerritoiresAAfficher,
  afficherLesCibles,
  setAfficherLesCibles,
  periodeSelectionnee,
  changerLaPeriodeSelectionnee,
  periodesSelectionnablesZoom,
  modeImpression = false,
  afficherInterrupteurCibles = true,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const chart = useRef<echarts.EChartsType | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chart.current = echarts.init(ref.current);
    chart.current.setOption({
      ...getOptions(modeImpression),
      animation: !modeImpression,
    });

    const handleResize = () => chart.current?.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.current?.dispose();
    };
  }, [modeImpression, getOptions]);

  return (
    <div>
      <div className="w-full h-[360px]" ref={ref} />
      <LineChartLegende
        afficherControls={!modeImpression}
        afficherInterrupteurCibles={afficherInterrupteurCibles}
        afficherLesCibles={afficherLesCibles}
        changerLaPeriodeSelectionnee={changerLaPeriodeSelectionnee}
        periodeSelectionnee={periodeSelectionnee}
        periodesSelectionnablesZoom={periodesSelectionnablesZoom}
        setAfficherLesCibles={setAfficherLesCibles}
        setTerritoiresAAfficher={setTerritoiresAAfficher}
        territoiresAAfficher={territoiresAAfficher}
        tousLesIndicateursDetails={tousLesIndicateursDetails}
      />
    </div>
  );
};

export default LineChart;
