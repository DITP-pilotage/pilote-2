import { useState, useMemo } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import type { Granularite } from "@/server/application-log/domain/ApplicationLogRepository.interface";

type Periode = "7j" | "30j";

function calculerDateDebut(periode: Periode): Date {
  const date = new Date();
  date.setDate(date.getDate() - (periode === "7j" ? 7 : 30));
  return date;
}

export function useGraphesLogs() {
  const [periode, setPeriode] = useState<Periode>("7j");
  const [granularite, setGranularite] = useState<Granularite>("jour");

  const dateDebut = useMemo(() => calculerDateDebut(periode), [periode]);
  const dateFin = useMemo(() => new Date(), []);

  const { data, isLoading } = api.applicationLog.statistiques.useQuery({
    dateDebut: dateDebut.toISOString(),
    dateFin: dateFin.toISOString(),
    granularite,
  });

  return {
    statistiques: data,
    isLoading,
    periode,
    setPeriode,
    granularite,
    setGranularite,
  };
}
