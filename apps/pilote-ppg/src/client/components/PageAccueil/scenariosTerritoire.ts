import { récupérerDétailsSurUnTerritoire } from "@/client/constants/territoires";
import type { ChatScenarios } from "@/components/_commons/ChatUI/ChatUI";
import { AlarmWarningIcon } from "@/components/_commons/Icones/AlarmWarningIcon";
import { AlignLeftIcon } from "@/components/_commons/Icones/AlignLeftIcon";
import { Chat2Icon } from "@/components/_commons/Icones/Chat2Icon";
import { Community1Icon } from "@/components/_commons/Icones/Community1Icon";
import { Dashboard3Icon } from "@/components/_commons/Icones/Dashboard3Icon";
import { ErrorWarningIcon } from "@/components/_commons/Icones/ErrorWarningIcon";
import { FileTextIcon } from "@/components/_commons/Icones/FileTextIcon";
import { LineChartIcon } from "@/components/_commons/Icones/LineChartIcon";
import { MapPin2Icon } from "@/components/_commons/Icones/MapPin2Icon";
import { PieChartIcon } from "@/components/_commons/Icones/PieChartIcon";
import { TimeIcon } from "@/components/_commons/Icones/TimeIcon";

export function scenariosTerritoireDITP({
  territoireCode,
  jalon,
  estDITPAdmin,
}: {
  territoireCode: string;
  jalon: number;
  estDITPAdmin: boolean;
}): ChatScenarios {
  const territoire = récupérerDétailsSurUnTerritoire(territoireCode);
  const estDepartement = territoire.maille === "departementale";
  const estRegion = territoire.maille === "regionale";
  const region =
    estDepartement && territoire.codeParent
      ? récupérerDétailsSurUnTerritoire(territoire.codeParent)
      : null;

  return {
    kind: "grouped",
    groups: [
      {
        label: "Synthèse",
        scenarios: [
          {
            label: "Synthèse d'un territoire",
            icone: AlignLeftIcon,
            message: "Fais moi la synthèse du territoire ",
            mode: "fill",
          },
          {
            label: "Synthèse d'un chantier sur un territoire",
            icone: MapPin2Icon,
            message: `Fais moi la synthèse du chantier CH-XXX sur le territoire NOM_TERRITOIRE
Comment se situe ce chantier par rapport aux autres territoires ?
Quelles sont les principales difficultés remontées dans les commentaires ?`,
            mode: "fill",
          },
          ...(estRegion
            ? [
                {
                  label: `Synthèse de ${territoire.nomAffiché} et ses départements`,
                  icone: Community1Icon,
                  message: `Fais moi la synthèse de ${territoire.nomAffiché} et ses départements`,
                  mode: "send" as const,
                },
              ]
            : []),
          {
            label: "Chantiers en retard et leurs indicateurs",
            icone: ErrorWarningIcon,
            message: `Analyse les chantiers en retard sur ${territoire.nomAffiché}. Pour chaque chantier en retard, récupère également les valeurs de ses indicateurs.`,
            mode: "send",
          },
          ...(estDITPAdmin
            ? [
                {
                  label: "Rapport complet (Markdown)",
                  icone: FileTextIcon,
                  message: `Crée un rapport de synthèse du territoire ${territoire.nomAffiché} incluant le taux d'avancement, les chantiers en retard, les chantiers en difficulté et leurs indicateurs. Format Markdown`,
                  mode: "send" as const,
                },
                {
                  label: "Tableau de bord du territoire",
                  icone: Dashboard3Icon,
                  message: `Compose un tableau de bord pour ${territoire.nomAffiché}. Commence par une première section contenant le taux d'avancement du territoire, le nombre de chantiers en retard, le nombre de chantiers en difficulté et la cartographie du taux d'avancement. Ensuite, récupère la liste des chantiers en difficulté et en retard sur ce territoire, et pour chacun, ajoute une section dédiée avec un titre reprenant le nom du chantier, la météo et le commentaire de synthèse, la cartographie météo en pleine largeur et le tableau de ses indicateurs.`,
                  mode: "send" as const,
                },
              ]
            : []),
        ],
      },
      {
        label: "Comparaison",
        scenarios: [
          {
            label: "Comparer avec un autre territoire",
            icone: LineChartIcon,
            message: `Compare ${territoire.nomAffiché} avec `,
            mode: "fill",
          },
          {
            label: `Comparer les taux d'avancement entre le jalon ${jalon} et un autre jalon`,
            icone: TimeIcon,
            message: `Compare les taux d'avancement de ${territoire.nomAffiché} entre le jalon ${jalon} et `,
            mode: "fill",
          },
          ...(estRegion
            ? [
                {
                  label: `Comparer ${territoire.nomAffiché} avec ses départements`,
                  icone: PieChartIcon,
                  message: `Compare ${territoire.nomAffiché} avec ses départements`,
                  mode: "send" as const,
                },
              ]
            : []),
          ...(estDepartement && region
            ? [
                {
                  label: `Comparer avec les autres départements de ${region.nomAffiché}`,
                  icone: PieChartIcon,
                  message: `Compare ${territoire.nomAffiché} avec les autres départements de ${region.nomAffiché}`,
                  mode: "send" as const,
                },
              ]
            : []),
        ],
      },
    ],
  };
}

export function scenariosTerritoireCoordinateur({
  territoireCode,
}: {
  territoireCode: string;
}): ChatScenarios {
  const territoire = récupérerDétailsSurUnTerritoire(territoireCode);

  return {
    kind: "grouped",
    groups: [
      {
        label: "Synthèse",
        scenarios: [
          {
            label: "Synthèse des difficultés d'un territoire",
            icone: AlarmWarningIcon,
            message: "Fais moi la synthèse des difficultés du territoire ",
            mode: "fill",
          },
          {
            label: "Détails des chantiers en retard et leurs indicateurs",
            icone: ErrorWarningIcon,
            message: `Analyse les chantiers en retard sur ${territoire.nomAffiché}. Pour chaque chantier en retard, récupère également les valeurs de ses indicateurs.`,
            mode: "send",
          },
          {
            label: "Synthèse des commentaires d'un/de plusieurs chantiers",
            icone: Chat2Icon,
            message:
              "Synthétise les commentaires des chantiers suivants CH-XXX, CH-YYY, notamment les principales actions identifiées",
            mode: "fill",
          },
          {
            label: "Synthèse d'un chantier sur un territoire",
            icone: MapPin2Icon,
            message: `Fais moi la synthèse du chantier CH-XXX sur ${territoire.nomAffiché}
Comment se situe ce chantier par rapport aux autres territoires ?
Quelles sont les principales difficultés remontées dans les commentaires ?`,
            mode: "fill",
          },
        ],
      },
      {
        label: "Comparaison",
        scenarios: [
          {
            label: "Comparaison quantitative des territoires",
            icone: LineChartIcon,
            message: `Compare les taux d'avancement de ${territoire.nomAffiché} avec `,
            mode: "fill",
          },
        ],
      },
    ],
  };
}
