import { useState, useCallback } from "react";
import { $Enums } from "@prisma/client";
import api from "@/server/infrastructure/api/trpc/api";

export function useTableauLogs() {
  const [page, setPage] = useState(1);
  const [filtreLevel, setFiltreLevel] = useState<
    $Enums.log_level | undefined
  >();
  const [filtreCategorie, setFiltreCategorie] = useState<string | undefined>();
  const [filtreRecherche, setFiltreRecherche] = useState<string | undefined>();
  const [dateDebut, setDateDebut] = useState<string | undefined>();
  const [dateFin, setDateFin] = useState<string | undefined>();
  const [logExpanduId, setLogExpanduId] = useState<string | null>(null);

  const taillePage = 50;

  const [data] = api.applicationLog.lister.useSuspenseQuery({
    page,
    taillePage,
    filtreLevel,
    filtreCategorie,
    filtreRecherche,
    dateDebut,
    dateFin,
  });

  const toggleExpansion = useCallback((id: string) => {
    setLogExpanduId((prev) => (prev === id ? null : id));
  }, []);

  const reinitialiserFiltres = useCallback(() => {
    setPage(1);
    setFiltreLevel(undefined);
    setFiltreCategorie(undefined);
    setFiltreRecherche(undefined);
    setDateDebut(undefined);
    setDateFin(undefined);
  }, []);

  const totalPages = Math.ceil(data.total / taillePage);

  return {
    logs: data.logs,
    total: data.total,
    page,
    setPage,
    totalPages,
    filtreLevel,
    setFiltreLevel,
    filtreCategorie,
    setFiltreCategorie,
    filtreRecherche,
    setFiltreRecherche,
    dateDebut,
    setDateDebut,
    dateFin,
    setDateFin,
    logExpanduId,
    toggleExpansion,
    reinitialiserFiltres,
  };
}
