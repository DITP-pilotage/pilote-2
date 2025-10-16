import { $Enums } from "@prisma/client";

type BadgeFicheEtapeProps = {
  etape: $Enums.etape_evaluation_enum;
};

const ETAPE_CONFIG: Record<
  $Enums.etape_evaluation_enum,
  { label: string; colorClasses: string }
> = {
  AUTO_EVALUATION: {
    label: "AE",
    colorClasses: "bg-yellow-100 text-yellow-700",
  },
  CONSOLIDATION: {
    label: "C",
    colorClasses: "bg-blue-100 text-blue-600",
  },
  CONTROLE_QUALITE: {
    label: "I",
    colorClasses: "bg-green-100 text-green-700",
  },
  AJUSTEMENTS: {
    label: "A",
    colorClasses: "bg-orange-100 text-orange-700",
  },
  CONTRE_PROPOSITION: {
    label: "C",
    colorClasses: "bg-purple-100 text-purple-700",
  },
  CONTROLE_QUALITE_BIS: {
    label: "I",
    colorClasses: "bg-green-100 text-green-700",
  },
  AJUSTEMENTS_BIS: {
    label: "A",
    colorClasses: "bg-orange-100 text-orange-700",
  },
};

export const BadgeFicheEtape = ({ etape }: BadgeFicheEtapeProps) => {
  const config = ETAPE_CONFIG[etape];

  return (
    <span
      className={`text-xs px-2 py-1.5 rounded-md whitespace-nowrap ${config.colorClasses}`}
    >
      {config.label}
    </span>
  );
};
