import { useSession } from "next-auth/react";
import { Session } from "next-auth";
import { $Enums } from "@prisma/client";
import api from "@/server/infrastructure/api/trpc/api";
import { BaseNavigation } from "./BaseNavigation";

const estAutoriseAAccederAPiloteEval = (session: Session) => {
  return session.applicationsAccessibles.includes(
    $Enums.application_accessible.PILOTE_EVAL,
  );
};

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
          nom: "Auto-évaluation",
          lien: "/evaluation/auto-evaluation",
          matcher: "/evaluation/auto-evaluation",
          accessible: estAutoriseAAccederAPiloteEval(session),
          prefetch: true,
          target: "_self",
        },
        {
          nom: "Appréciation",
          lien: "/evaluation/consolidation",
          matcher: "/evaluation/consolidation",
          accessible: droitsPiloteEval?.peutAccederConsolidation ?? false,
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
      ]}
    />
  );
};
