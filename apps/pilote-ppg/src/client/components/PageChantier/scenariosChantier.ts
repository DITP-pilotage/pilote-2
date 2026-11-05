import { récupérerDétailsSurUnTerritoire } from "@/client/constants/territoires";
import type {
  ChatScenario,
  ChatScenarios,
} from "@/components/_commons/ChatUI/ChatEmptyState";
import { AlignLeftIcon } from "@/components/_commons/Icones/AlignLeftIcon";
import { Chat2Icon } from "@/components/_commons/Icones/Chat2Icon";
import { ErrorWarningIcon } from "@/components/_commons/Icones/ErrorWarningIcon";
import { LineChartIcon } from "@/components/_commons/Icones/LineChartIcon";
import { PieChartIcon } from "@/components/_commons/Icones/PieChartIcon";
import { TimeIcon } from "@/components/_commons/Icones/TimeIcon";

/**
 * Les scénarios de la page chantier. Une comparaison porte sur un ensemble
 * borné, qui dépend de la maille de la page : « les autres territoires » ne
 * désigne aucun périmètre, et la position face à eux est déjà l'écart à la
 * médiane, que donne la synthèse.
 */
export function scenariosChantier({
  chantierId,
  territoireCode,
  jalon,
}: {
  chantierId: string;
  territoireCode: string;
  jalon: number;
}): ChatScenarios {
  const nom = récupérerDétailsSurUnTerritoire(territoireCode).nomAffiché;

  return {
    kind: "grouped",
    groups: [
      {
        label: "Synthèse",
        scenarios: [
          {
            id: "chantier_synthese",
            label: "Synthèse du chantier",
            icone: AlignLeftIcon,
            message: `Fais moi la synthèse du chantier ${chantierId} sur ${nom}`,
            mode: "send",
          },
          {
            id: "chantier_valeurs_indicateurs",
            label: "Valeurs des indicateurs",
            icone: LineChartIcon,
            message: `Quelles sont les valeurs des indicateurs du ${chantierId} sur ${nom} ?`,
            mode: "send",
          },
          {
            id: "chantier_synthese_commentaires",
            label: "Synthèse des commentaires",
            icone: Chat2Icon,
            message: `Synthétise les commentaires du chantier ${chantierId} sur ${nom}`,
            mode: "send",
          },
          {
            id: "chantier_valeurs_non_a_jour",
            label: "Valeurs d'avancement non à jour",
            icone: ErrorWarningIcon,
            message: `Quels indicateurs du ${chantierId} ont des valeurs d'avancement non à jour sur ${nom} ?`,
            mode: "send",
          },
        ],
      },
      {
        label: "Comparaison",
        scenarios: [
          ...comparaisonsSelonLaMaille({ chantierId, territoireCode }),
          {
            id: "chantier_comparer_jalons",
            label: `Comparer le jalon ${jalon} avec un autre jalon`,
            icone: TimeIcon,
            message: `Compare le ${chantierId} sur ${nom} entre le jalon ${jalon} et `,
            mode: "fill",
          },
        ],
      },
    ],
  };
}

function comparaisonsSelonLaMaille({
  chantierId,
  territoireCode,
}: {
  chantierId: string;
  territoireCode: string;
}): ChatScenario[] {
  const territoire = récupérerDétailsSurUnTerritoire(territoireCode);
  const nom = territoire.nomAffiché;

  if (territoire.maille === "nationale") {
    return [
      {
        id: "chantier_comparer_regions",
        label: "Comparer les régions",
        icone: PieChartIcon,
        message: `Compare le ${chantierId} entre les régions`,
        mode: "send",
      },
    ];
  }

  if (territoire.maille === "regionale") {
    return [
      {
        id: "chantier_comparer_region_departements",
        label: `Comparer ${nom} avec ses départements`,
        icone: PieChartIcon,
        message: `Compare le ${chantierId} sur ${nom} avec ses départements`,
        mode: "send",
      },
      {
        id: "chantier_comparer_regions",
        label: "Comparer avec les autres régions",
        icone: LineChartIcon,
        message: `Compare le ${chantierId} sur ${nom} avec les autres régions`,
        mode: "send",
      },
    ];
  }

  if (!territoire.codeParent) return [];
  const region = récupérerDétailsSurUnTerritoire(territoire.codeParent);
  return [
    {
      id: "chantier_comparer_departements_region",
      label: "Comparer avec les autres départements de la région",
      icone: PieChartIcon,
      message: `Compare le ${chantierId} sur ${nom} avec les autres départements de la région ${region.nomAffiché}`,
      mode: "send",
    },
  ];
}
