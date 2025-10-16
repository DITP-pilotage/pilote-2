import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { pagePilotage } from "@/components/PagePilotage/PagePilotageServerSideContext";

type FicheEvaluationRow = {
  id: string;
  rattachementCode: string;
  rattachementLibelle: string;
  evaluationsParCritereEtEtape: Record<string, Record<string, number | null>>;
  evaluationsParObjectifEtEtape: Record<string, Record<string, number | null>>;
};

const columnHelper = createColumnHelper<FicheEvaluationRow>();

const ETAPES = [
  { key: "AUTO_EVALUATION", label: "Auto-évaluation" },
  { key: "CONSOLIDATION", label: "Consolidation" },
  { key: "CONTROLE_QUALITE", label: "Instruction" },
] as const;

export const usePilotageTable = () => {
  const { fichesEvaluation, criteres, objectifs } =
    pagePilotage.useServerSidePropsContext().pilotage;

  const data = useMemo<FicheEvaluationRow[]>(() => {
    return fichesEvaluation.map((fiche) => ({
      id: fiche.id,
      rattachementCode: fiche.rattachement.code,
      rattachementLibelle: fiche.rattachement.libelle,
      evaluationsParCritereEtEtape: fiche.evaluationsParCritereEtEtape,
      evaluationsParObjectifEtEtape: fiche.evaluationsParObjectifEtEtape,
    }));
  }, [fichesEvaluation]);

  const columns = useMemo(() => {
    const stickyColumns = [
      columnHelper.accessor("rattachementCode", {
        id: "code",
        header: "Code",
        cell: (info) => (
          <div className="font-mono text-sm whitespace-nowrap">
            {info.getValue()}
          </div>
        ),
        size: 120,
        meta: {
          sticky: "left",
          stickyOffset: 0,
        },
      }),
      columnHelper.accessor("rattachementLibelle", {
        id: "libelle",
        header: "Territoire",
        cell: (info) => (
          <div className="font-semibold whitespace-nowrap">
            {info.getValue()}
          </div>
        ),
        size: 250,
        meta: {
          sticky: "left",
          stickyOffset: 92,
        },
      }),
    ];

    const critereColumns = criteres.map((critere, index) =>
      columnHelper.group({
        id: `critere-${critere.id}`,
        header: () => (
          <div className="text-xs font-medium flex flex-col items-center">
            <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded mb-1 inline-block">
              Critère
            </div>
            <div>{critere.libelle}</div>
          </div>
        ),
        columns: ETAPES.map((etape, etapeIndex) =>
          columnHelper.display({
            id: `critere-${critere.id}-${etape.key}`,
            header: etape.label,
            cell: (info) => {
              const note =
                info.row.original.evaluationsParCritereEtEtape[critere.id]?.[
                  etape.key
                ];
              return (
                <div className="text-center">
                  {note !== null && note !== undefined ? note : "-"}
                </div>
              );
            },
            size: 100,
            meta: {
              isFirstInGroup: etapeIndex === 0,
              isFirstGroup: index === 0,
            },
          }),
        ),
      }),
    );

    const objectifColumns = objectifs.map((objectif, index) =>
      columnHelper.group({
        id: `objectif-${objectif.id}`,
        header: () => (
          <div className="text-xs font-medium flex flex-col items-center">
            <div className="bg-green-50 text-green-700 px-2 py-1 rounded mb-1 inline-block">
              Objectif
            </div>
            <div>{objectif.libelle}</div>
          </div>
        ),
        columns: ETAPES.map((etape, etapeIndex) =>
          columnHelper.display({
            id: `objectif-${objectif.id}-${etape.key}`,
            header: etape.label,
            cell: (info) => {
              const note =
                info.row.original.evaluationsParObjectifEtEtape[objectif.id]?.[
                  etape.key
                ];
              return (
                <div className="text-center">
                  {note !== null && note !== undefined ? note : "-"}
                </div>
              );
            },
            size: 100,
            meta: {
              isFirstInGroup: etapeIndex === 0,
              isFirstGroup: index === 0 && criteres.length === 0,
            },
          }),
        ),
      }),
    );

    return [...stickyColumns, ...critereColumns, ...objectifColumns];
  }, [criteres, objectifs]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return { table };
};
