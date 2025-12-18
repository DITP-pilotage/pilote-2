import {
  createColumnHelper,
  getCoreRowModel,
  getGroupedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { $Enums } from "@prisma/client";
import { pagePilotage } from "@/components/PagePilotage/PagePilotageServerSideContext";

type FicheEvaluationRow = {
  id: string;
  readOnly: boolean;
  rattachementCode: string;
  rattachementLibelle: string;
  rattachementGroupe: string;
  rattachementOrdre: number;
  etapeCourante: $Enums.etape_evaluation_enum;
  evaluationsParCritereEtEtape: Record<string, Record<string, number | null>>;
  objectifs: Array<{
    id: string;
    libelle: string;
    evaluations: Record<string, number | null>;
  }>;
};

const columnHelper = createColumnHelper<FicheEvaluationRow>();

const columns = [
  columnHelper.display({
    id: "select",
    header: "",
    cell: ({ row }) => (
      <input
        checked={row.getIsSelected()}
        className="cursor-pointer"
        disabled={!row.getCanSelect()}
        onChange={row.getToggleSelectedHandler()}
        type="checkbox"
      />
    ),
  }),
  columnHelper.accessor("rattachementGroupe", {
    id: "rattachementGroupe",
  }),
];

export const ETAPES: { key: $Enums.etape_evaluation_enum; label: string }[] = [
  { key: "AUTO_EVALUATION", label: "ÉVAL" },
  { key: "CONSOLIDATION", label: "APPR" },
  { key: "INSTRUCTION", label: "INSTR" },
];

export const useTableauPilotage = () => {
  const { fichesEvaluation, criteres } =
    pagePilotage.useServerSidePropsContext().pilotage;

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const data = useMemo<FicheEvaluationRow[]>(() => {
    return fichesEvaluation.map((fiche) => ({
      id: fiche.id,
      readOnly: fiche.readOnly,
      rattachementCode: fiche.rattachement.code,
      rattachementLibelle: fiche.rattachement.libelle,
      rattachementGroupe: fiche.rattachement.groupe,
      rattachementOrdre: fiche.rattachement.ordre,
      etapeCourante: fiche.etapeCourante,
      evaluationsParCritereEtEtape: fiche.evaluationsParCritereEtEtape,
      objectifs: fiche.objectifs,
    }));
  }, [fichesEvaluation]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    initialState: {
      grouping: ["rattachementGroupe"],
    },
    state: {
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
  });

  const maxObjectifs = fichesEvaluation.reduce(
    (max, fiche) => Math.max(max, fiche.objectifs.length),
    0,
  );

  return {
    table,
    fichesSelectionneesIds: Object.keys(rowSelection),
    criteres,
    maxObjectifs,
    ETAPES,
  };
};
