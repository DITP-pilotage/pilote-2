import "@gouvfr/dsfr/dist/component/navigation/navigation.min.css";
import "@gouvfr/dsfr/dist/component/button/button.min.css";
import "@gouvfr/dsfr/dist/component/modal/modal.min.css";
import "@gouvfr/dsfr/dist/component/notice/notice.min.css";
import { $Enums } from "@prisma/client";
import { useCurrentApplication } from "@/client/hooks/useCurrentApplication";
import { NavigationPiloteEval } from "./NavigationPiloteEval";
import { NavigationPilote } from "./NavigationPilote";

export const Navigation = () => {
  const currentApplication = useCurrentApplication();

  if (currentApplication === $Enums.application_accessible.PILOTE_EVAL)
    return <NavigationPiloteEval />;

  return <NavigationPilote />;
};
