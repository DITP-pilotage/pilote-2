import { useState, useCallback } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import { $Enums } from "@prisma/client";

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

  const { data, isLoading } = api.applicationLog.lister.useQuery({
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

  const totalPages = data ? Math.ceil(data.total / taillePage) : 0;

  return {
    logs: data?.logs ?? [],
    total: data?.total ?? 0,
    isLoading,
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
