import { récupérerDétailsSurUnTerritoire } from "@/client/constants/territoires";
import type { ChatScenarios } from "@/components/_commons/ChatUI/ChatEmptyState";
import { AlignLeftIcon } from "@/components/_commons/Icones/AlignLeftIcon";
import { Chat2Icon } from "@/components/_commons/Icones/Chat2Icon";
import { ErrorWarningIcon } from "@/components/_commons/Icones/ErrorWarningIcon";
import { MapPin2Icon } from "@/components/_commons/Icones/MapPin2Icon";

export function scenariosChantier({
  chantierId,
  territoireCode,
  jalon,
}: {
  chantierId: string;
  territoireCode: string;
  jalon: number;
}): ChatScenarios {
  const territoire = récupérerDétailsSurUnTerritoire(territoireCode).nomAffiché;

  return {
    kind: "flat",
    scenarios: [
      {
        id: "chantier_synthese",
        label: "Synthèse du chantier",
        icone: AlignLeftIcon,
        message: `Fais moi la synthèse du chantier ${chantierId} sur ${territoire}`,
        mode: "send",
      },
      {
        id: "chantier_indicateurs_en_retard",
        label: "Indicateurs en retard",
        icone: ErrorWarningIcon,
        message: `Quels indicateurs du chantier ${chantierId} sont en retard sur ${territoire} au jalon ${jalon} ?`,
        mode: "send",
      },
      {
        id: "chantier_comparaison_territoires",
        label: "Comparaison avec les autres territoires",
        icone: MapPin2Icon,
        message: `Comment se situe le chantier ${chantierId} sur ${territoire} par rapport aux autres territoires ?`,
        mode: "send",
      },
      {
        id: "chantier_synthese_commentaires",
        label: "Synthèse des commentaires",
        icone: Chat2Icon,
        message: `Synthétise les commentaires du chantier ${chantierId} sur ${territoire} : principales difficultés et actions`,
        mode: "send",
      },
    ],
  };
}
