import { $Enums } from "@prisma/client";
import { BadgeFicheEtape } from "@/components/_commons/BadgeFicheEtape/BadgeFicheEtape";

export const LegendeTableauPilotage = () => (
  <div className="flex items-center gap-4">
    <span className="text-sm font-medium text-gray-700">Légende :</span>
    <div className="flex items-center gap-2">
      <BadgeFicheEtape etape={$Enums.etape_evaluation_enum.AUTO_EVALUATION} />
      <span className="text-xs text-gray-600">Auto-évaluation</span>
    </div>
    <div className="flex items-center gap-2">
      <BadgeFicheEtape etape={$Enums.etape_evaluation_enum.CONSOLIDATION} />
      <span className="text-xs text-gray-600">Consolidation</span>
    </div>
    <div className="flex items-center gap-2">
      <BadgeFicheEtape etape={$Enums.etape_evaluation_enum.CONTROLE_QUALITE} />
      <span className="text-xs text-gray-600">Instruction</span>
    </div>
  </div>
);
