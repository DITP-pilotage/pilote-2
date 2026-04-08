import { useCallback, useMemo, useState } from "react";
import { $Enums } from "@prisma/client";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ApplicationLogEntree } from "@/server/application-log/queries/ListerLogsQuery";
import api from "@/server/infrastructure/api/trpc/api";

const columnHelper = createColumnHelper<ApplicationLogEntree>();

const TAILLE_PAGE = 50;

export function useTableauLogs() {
  const [page, setPage] = useState(1);
  const [filtreLevel, setFiltreLevel] = useState<
    $Enums.log_level | undefined
  >();
  const [filtreCategorie, setFiltreCategorie] = useState<string | undefined>();
  const [filtreRecherche, setFiltreRecherche] = useState<string | undefined>();
  const [dateDebut, setDateDebut] = useState<string | undefined>();
  const [dateFin, setDateFin] = useState<string | undefined>();
  const [logsExpandus, setLogsExpandus] = useState<Set<string>>(new Set());

  const [data] = api.applicationLog.lister.useSuspenseQuery({
    page,
    taillePage: TAILLE_PAGE,
    filtreLevel,
    filtreCategorie,
    filtreRecherche,
    dateDebut,
    dateFin,
  });

  const toggleExpansion = useCallback((id: string) => {
    setLogsExpandus((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const totalPages = Math.ceil(data.total / TAILLE_PAGE);

  const columns = useMemo(
    () => [
      columnHelper.accessor("timestamp", {
        header: "Timestamp",
        id: "timestamp",
      }),
      columnHelper.accessor("level", {
        header: "Niveau",
        id: "level",
      }),
      columnHelper.accessor("categorie", {
        header: "Catégorie",
        id: "categorie",
      }),
      columnHelper.accessor("message", {
        header: "Message",
        id: "message",
      }),
      columnHelper.accessor("source", {
        header: "Source",
        id: "source",
      }),
      columnHelper.display({
        id: "expand",
        header: "",
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: data.logs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize: TAILLE_PAGE,
      },
    },
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newState = updater({
          pageIndex: page - 1,
          pageSize: TAILLE_PAGE,
        });
        setPage(newState.pageIndex + 1);
      }
    },
    getRowId: (row) => row.id,
  });

  return {
    table,
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
    logsExpandus,
    toggleExpansion,
  };
}
