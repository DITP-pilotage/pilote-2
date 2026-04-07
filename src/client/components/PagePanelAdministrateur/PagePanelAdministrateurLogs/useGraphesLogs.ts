import { useState, useRef } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import type { Granularite } from "@/server/application-log/domain/ApplicationLogRepository.interface";

type Periode = "7j" | "30j";

function calculerDateDebutISO(periode: Periode): string {
  const date = new Date();
  date.setDate(date.getDate() - (periode === "7j" ? 7 : 30));
  return date.toISOString();
}

export function useGraphesLogs() {
  const [periode, setPeriode] = useState<Periode>("7j");
  const [granularite, setGranularite] = useState<Granularite>("jour");

  const dateFinRef = useRef(new Date().toISOString());
  const dateDebutRef = useRef(calculerDateDebutISO(periode));

  const handleSetPeriode = (newPeriode: Periode) => {
    setPeriode(newPeriode);
    dateDebutRef.current = calculerDateDebutISO(newPeriode);
    dateFinRef.current = new Date().toISOString();
  };

  const [data] = api.applicationLog.statistiques.useSuspenseQuery({
    dateDebut: dateDebutRef.current,
    dateFin: dateFinRef.current,
    granularite,
  });

  return {
    statistiques: data,
    periode,
    setPeriode: handleSetPeriode,
    granularite,
    setGranularite,
  };
}
