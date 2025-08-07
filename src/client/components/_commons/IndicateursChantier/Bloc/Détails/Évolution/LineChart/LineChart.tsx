import { FunctionComponent, useEffect, useRef } from "react";
import * as echarts from "echarts";
import { ECOption } from "@/client/components/_commons/IndicateursChantier/Bloc/Détails/Évolution/useIndicateurEvolutionNew";
import LineChartStyledStyled from "./LineChart.styled";

interface TimeSeriesChartProps {
  option: ECOption;
}

const LineChart: FunctionComponent<TimeSeriesChartProps> = ({ option }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const chart = useRef<echarts.EChartsType | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chart.current = echarts.init(ref.current);
    chart.current.setOption(option);

    const handleResize = () => chart.current?.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.current?.dispose();
    };
  }, [option]);

  return <LineChartStyledStyled ref={ref} />;
};

export default LineChart;
