import { Icone } from "@/components/_commons/Icone";
import { Table2Icon } from "@/components/_commons/Icones/Table2Icon";

export const BoutonExportCsv = ({
  enCours,
  onClick,
}: {
  enCours: boolean;
  onClick: () => void;
}) => (
  <button
    aria-busy={enCours}
    aria-label="Exporter en CSV"
    disabled={enCours}
    onClick={onClick}
    type="button"
  >
    <Icone className="w-4 h-4" icone={Table2Icon} />
  </button>
);
