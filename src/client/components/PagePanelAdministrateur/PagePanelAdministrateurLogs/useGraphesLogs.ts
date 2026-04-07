import api from "@/server/infrastructure/api/trpc/api";
import type { Granularite } from "@/server/application-log/domain/ApplicationLogRepository.interface";

export type Periode = "7j" | "30j";

export function useGraphesLogs(input: {
  dateDebut: string;
  dateFin: string;
  granularite: Granularite;
}) {
  const [data] = api.applicationLog.statistiques.useSuspenseQuery(input);
  return data;
}
