import {
  createColumnHelper,
  getCoreRowModel,
  getGroupedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { $Enums } from "@prisma/client";
import { pagePilotage } from "@/components/PagePilotage/PagePilotageServerSideContext";

export type FicheEvaluationRow = {
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
  noteObjectifsCollectifs: number | null;
  moyennesCriteres: Record<string, number | null>;
  moyennesObjectifs: Record<string, number | null>;
  synthese: Record<string, number | null>;
};

const columnHelper = createColumnHelper<FicheEvaluationRow>();

const columns = [
  columnHelper.accessor("rattachementGroupe", {
    id: "rattachementGroupe",
  }),
];

export const ETAPES: { key: $Enums.etape_evaluation_enum; label: string }[] = [
  { key: "AUTO_EVALUATION", label: "ÉVAL" },
  { key: "CONSOLIDATION", label: "APPR" },
  { key: "INSTRUCTION", label: "INSTR" },
];

const ETAPES_ORDER: Record<$Enums.etape_evaluation_enum, number> = {
  AUTO_EVALUATION: 0,
  CONSOLIDATION: 1,
  INSTRUCTION: 2,
};

export type PhaseStatus = "before" | "current" | "after";

export const getPhaseStatus = (
  etape: $Enums.etape_evaluation_enum,
  etapeCourante: $Enums.etape_evaluation_enum,
): PhaseStatus => {
  const etapeOrder = ETAPES_ORDER[etape];
  const etapeCouranteOrder = ETAPES_ORDER[etapeCourante];

  if (etapeOrder < etapeCouranteOrder) {
    return "before";
  } else if (etapeOrder === etapeCouranteOrder) {
    return "current";
  } else {
    return "after";
  }
};

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
      noteObjectifsCollectifs: fiche.noteObjectifsCollectifs,
      moyennesCriteres: fiche.moyennesCriteres,
      moyennesObjectifs: fiche.moyennesObjectifs,
      synthese: fiche.synthese,
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

  return {
    table,
    fichesSelectionneesIds: Object.keys(rowSelection),
    criteres,
  };
};
