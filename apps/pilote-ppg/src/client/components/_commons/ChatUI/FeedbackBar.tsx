import { useState } from "react";
import { $Enums } from "@prisma/client";
import { FeedbackNegatifModale } from "@/components/_commons/ChatUI/FeedbackNegatifModale";
import api from "@/server/infrastructure/api/trpc/api";

export const FeedbackBar = ({ chatId }: { chatId: string }) => {
  const [evaluationSoumise, setEvaluationSoumise] = useState(false);

  const evaluerMutation = api.albert.evaluer.useMutation({
    onSuccess: () => setEvaluationSoumise(true),
  });

  return (
    <div className="shrink-0 border-t border-gray-100 px-4 py-2 bg-white">
      <div className="max-w-3xl mx-auto flex items-center gap-3 text-sm text-gray-500">
        {!evaluationSoumise ? (
          <>
            <span>Trouvez-vous l'assistant utile ?</span>
            <button
              className="rounded-full border border-gray-300 px-3 py-1 hover:bg-gray-100 transition-colors disabled:opacity-50"
              disabled={evaluerMutation.isPending}
              onClick={() =>
                evaluerMutation.mutate({
                  chatId,
                  evaluation: $Enums.llm_call_evaluation.POSITIVE,
                })
              }
              type="button"
            >
              Oui
            </button>
            <FeedbackNegatifModale
              chatId={chatId}
              disabled={evaluerMutation.isPending}
              onSuccess={() => setEvaluationSoumise(true)}
            />
          </>
        ) : (
          <span>Merci pour votre retour !</span>
        )}
      </div>
    </div>
  );
};
