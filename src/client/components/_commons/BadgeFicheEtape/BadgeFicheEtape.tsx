import { $Enums } from "@prisma/client";

const ETAPE_CONFIG: Record<
  $Enums.etape_evaluation_enum,
  { labelPetit: string; label: string; colorClasses: string }
> = {
  AUTO_EVALUATION: {
    labelPetit: "AE",
    label: "Auto-évaluation",
    colorClasses: "bg-yellow-100 text-yellow-700",
  },
  CONSOLIDATION: {
    labelPetit: "C",
    label: "Consolidation",
    colorClasses: "bg-blue-100 text-blue-600",
  },
  INSTRUCTION: {
    labelPetit: "I",
    label: "Instruction",
    colorClasses: "bg-green-100 text-green-700",
  },
};

export const BadgeFicheEtape = ({
  etape,
  taille = "petit",
}: {
  etape: $Enums.etape_evaluation_enum;
  taille?: "petit" | "grand";
}) => {
  const config = ETAPE_CONFIG[etape];

  return (
    <span
      className={`text-xs px-2 py-1.5 rounded-md whitespace-nowrap ${config.colorClasses}`}
    >
      {taille === "petit" ? config.labelPetit : config.label}
    </span>
  );
};
