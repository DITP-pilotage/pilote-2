import {
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useEffect,
  useRef,
} from "react";
import * as echarts from "echarts";
import { IndicateurDétailsParTerritoire } from "@/client/components/_commons/IndicateursChantier/Bloc/IndicateurBloc.interface";
import { ECOption } from "@/client/components/_commons/IndicateursChantier/Bloc/Détails/Évolution/useIndicateurEvolutionNew";
import { LineChartStyled } from "./LineChart.styled";
import LineChartLegende from "./LineChartLegende/LineChartLegende";

interface LineChartProps {
  option: ECOption;
  tousLesIndicateursDetails: IndicateurDétailsParTerritoire[];
  territoiresAAfficher: Record<string, boolean>;
  setTerritoiresAAfficher: Dispatch<Record<string, boolean>>;
  afficherLesCibles: boolean;
  setAfficherLesCibles: Dispatch<SetStateAction<boolean>>;
  periodeSelectionnee: string;
  changerLaPeriodeSelectionnee: (periode: string) => void;
  periodesSelectionnablesZoom: string[];
  modeImpression?: boolean;
}

const LineChart: FunctionComponent<LineChartProps> = ({
  option,
  tousLesIndicateursDetails,
  territoiresAAfficher,
  setTerritoiresAAfficher,
  afficherLesCibles,
  setAfficherLesCibles,
  periodeSelectionnee,
  changerLaPeriodeSelectionnee,
  periodesSelectionnablesZoom,
  modeImpression = false,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const chart = useRef<echarts.EChartsType | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chart.current = echarts.init(ref.current);
    chart.current.setOption({ ...option, animation: !modeImpression });

    const handleResize = () => chart.current?.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.current?.dispose();
    };
  }, [modeImpression, option]);

  return (
    <LineChartStyled>
      <div className="container-graphique" ref={ref} />
      <LineChartLegende
        afficherControls={!modeImpression}
        afficherLesCibles={afficherLesCibles}
        changerLaPeriodeSelectionnee={changerLaPeriodeSelectionnee}
        periodeSelectionnee={periodeSelectionnee}
        periodesSelectionnablesZoom={periodesSelectionnablesZoom}
        setAfficherLesCibles={setAfficherLesCibles}
        setTerritoiresAAfficher={setTerritoiresAAfficher}
        territoiresAAfficher={territoiresAAfficher}
        tousLesIndicateursDetails={tousLesIndicateursDetails}
      />
    </LineChartStyled>
  );
};

export default LineChart;
