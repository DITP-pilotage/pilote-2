import { useState } from "react";
import { $Enums } from "@prisma/client";
import api from "@/server/infrastructure/api/trpc/api";

export const useEvaluerChat = ({ chatId }: { chatId: string }) => {
  const [evaluationEnvoyee, setEvaluationEnvoyee] = useState<$Enums.llm_call_evaluation | null>(null);

  const { mutate, isPending } = api.albert.evaluer.useMutation({
    onSuccess: (_data, variables) => {
      setEvaluationEnvoyee(variables.evaluation);
    },
  });

  const evaluer = (evaluation: $Enums.llm_call_evaluation) => {
    mutate({ chatId, evaluation });
  };

  return {
    evaluer,
    evaluationEnvoyee,
    isLoading: isPending,
  };
};
