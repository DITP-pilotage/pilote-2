import { $Enums } from "@prisma/client";
import { clsxm } from "@/utils/clsxm";
import { Icone } from "@/components/_commons/Icone";
import { DraftPleineIcon } from "@/components/_commons/Icones/DraftPleineIcon";
import { QuillPen1Icon } from "@/components/_commons/Icones/QuillPen1Icon";
import { SuccessIcon } from "@/components/_commons/Icones/SuccessIcon";

const VARIANTS = {
  [$Enums.etape_evaluation_enum.AUTO_EVALUATION]: {
    label: "Auto-évaluation",
    icone: QuillPen1Icon,
  },
  [$Enums.etape_evaluation_enum.CONSOLIDATION]: {
    label: "Appréciation",
    icone: SuccessIcon,
  },
  [$Enums.etape_evaluation_enum.INSTRUCTION]: {
    label: "Instruction",
    icone: DraftPleineIcon,
  },
};

export const BadgeEtape = ({
  etapeCourante,
}: {
  etapeCourante: $Enums.etape_evaluation_enum;
}) => {
  return (
    <span
      className={clsxm(
        "inline-flex gap-1 items-center py-1 px-1.5 text-xs font-bold rounded uppercase",
        {
          "bg-dsfr-green-bourgeon-975 text-dsfr-green-bourgeon-main-640":
            etapeCourante === $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          "bg-dsfr-green-menthe-975 text-dsfr-green-menthe-main-548":
            etapeCourante === $Enums.etape_evaluation_enum.CONSOLIDATION,
          "bg-dsfr-green-emeraude-975 text-dsfr-green-emeraude-main-632":
            etapeCourante === $Enums.etape_evaluation_enum.INSTRUCTION,
        },
      )}
    >
      <Icone
        className="text-current h-4 w-4"
        icone={VARIANTS[etapeCourante].icone}
      />
      <span className="line-clamp-1">{VARIANTS[etapeCourante].label}</span>
    </span>
  );
};
