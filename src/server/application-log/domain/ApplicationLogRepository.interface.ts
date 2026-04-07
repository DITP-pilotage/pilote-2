import { $Enums } from "@prisma/client";

export type ApplicationLogFiltre = {
  page: number;
  taillePage: number;
  filtreLevel?: $Enums.log_level;
  filtreCategorie?: string;
  filtreRecherche?: string;
  dateDebut?: Date;
  dateFin?: Date;
};

export type ApplicationLogEntree = {
  id: string;
  timestamp: Date;
  level: $Enums.log_level;
  categorie: string;
  message: string;
  contexte: unknown;
  source: string | null;
  duree_ms: number | null;
};

export type StatistiquesLogs = {
  parLevel: { level: $Enums.log_level; count: number }[];
  parCategorie: { categorie: string; count: number }[];
  timeline: { date: string; info: number; warn: number; error: number }[];
};

export type Granularite = "heure" | "jour" | "semaine";

export interface ApplicationLogRepository {
  lister(
    filtres: ApplicationLogFiltre,
  ): Promise<{ logs: ApplicationLogEntree[]; total: number }>;

  obtenirStatistiques(
    dateDebut: Date,
    dateFin: Date,
    granularite: Granularite,
  ): Promise<StatistiquesLogs>;

  purger(anterieurA: Date): Promise<number>;
}
