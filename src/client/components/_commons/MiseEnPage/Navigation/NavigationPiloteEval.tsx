import { useSession } from "next-auth/react";
import api from "@/server/infrastructure/api/trpc/api";
import { BaseNavigation } from "./BaseNavigation";

export const NavigationPiloteEval = () => {
  const { data: session } = useSession();
  const { data: droitsPiloteEval } =
    api.evaluation.getDroitsPiloteEval.useQuery(undefined, {
      enabled: session != null,
    });

  if (session == null) return null;

  return (
    <BaseNavigation
      pages={[
        {
          nom: "Appréciation",
          lien: "/evaluation/appreciation",
          matcher: "/evaluation/appreciation",
          accessible: droitsPiloteEval?.peutAccederAppreciation ?? false,
          prefetch: true,
          target: "_self",
        },
        {
          nom: "Instruction",
          lien: "/evaluation/instruction",
          matcher: "/evaluation/instruction",
          accessible: droitsPiloteEval?.peutAccederInstruction ?? false,
          prefetch: true,
          target: "_self",
        },
        {
          nom: "Pilotage",
          lien: "/evaluation/pilotage",
          matcher: "/evaluation/pilotage",
          accessible: droitsPiloteEval?.peutAccederPilotage ?? false,
          prefetch: true,
          target: "_self",
        },
        {
          nom: "Utilisateurs",
          lien: "/evaluation/utilisateurs",
          matcher: "/evaluation/utilisateurs",
          accessible: droitsPiloteEval?.peutAccederPilotage ?? false,
          prefetch: true,
          target: "_self",
        },
        {
          nom: "Centre d'aide",
          lien: "/centre-aide-pilote-2/centre-aide-eval",
          matcher: "/centre-aide-pilote-2/centre-aide-eval",
          accessible: droitsPiloteEval?.peutAccederPilotage ?? false,
          prefetch: false,
          target: "_blank",
        },
      ]}
    />
  );
};
