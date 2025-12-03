import { Table } from "@tanstack/react-table";
import { useEffect, useRef } from "react";
import { useSetCritereOuObjectif } from "@/components/Evaluation/LayoutFicheCadrage";
import { useGetCritere } from "@/components/Evaluation/CriteresProvider";
import { TableauEvaluationRow } from "@/components/Evaluation/TableauEvaluation";

export const SetFicheCadrageInitiale = ({
  table,
}: {
  table: Table<TableauEvaluationRow>;
}) => {
  const initRef = useRef(false);
  const setCritereOuObjectif = useSetCritereOuObjectif();
  const getCritere = useGetCritere();
  const rows = table.getRowModel().flatRows;

  useEffect(() => {
    if (initRef.current) return;
    if (rows.length > 0) {
      initRef.current = true;
      const firstRow = rows[0].original;
      if (firstRow.type === "critere") {
        const critere = getCritere(firstRow.id);
        if (critere == null) return;
        setCritereOuObjectif({ type: "critere", critere });
      } else {
        setCritereOuObjectif({ type: "objectif", objectif: firstRow });
      }
    }
  }, [getCritere, rows, setCritereOuObjectif]);

  return null;
};
