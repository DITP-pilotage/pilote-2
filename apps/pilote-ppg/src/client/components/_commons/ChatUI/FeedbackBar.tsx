import { useState } from "react";
import { FeedbackNegatifModale } from "@/components/_commons/ChatUI/FeedbackNegatifModale";
import { FeedbackPositiveModale } from "@/components/_commons/ChatUI/FeedbackPositiveModale";

export const FeedbackBar = ({ chatId }: { chatId: string }) => {
  const [evaluationSoumise, setEvaluationSoumise] = useState(false);
  const [positiveOuverte, setPositiveOuverte] = useState(false);

  return (
    <div className="shrink-0 border-t border-gray-100 px-4 py-2 bg-white">
      <div className="max-w-3xl mx-auto flex items-center gap-3 text-sm text-gray-500">
        {!evaluationSoumise ? (
          <>
            <span>Trouvez-vous l&apos;assistant utile ?</span>
            <button
              className="rounded-full border border-gray-300 px-3 py-1 hover:bg-gray-100 transition-colors disabled:opacity-50"
              onClick={() => setPositiveOuverte(true)}
              type="button"
            >
              Oui
            </button>
            <FeedbackNegatifModale
              chatId={chatId}
              disabled={false}
              onSuccess={() => setEvaluationSoumise(true)}
            />
            <FeedbackPositiveModale
              chatId={chatId}
              onOpenChange={setPositiveOuverte}
              onSuccess={() => setEvaluationSoumise(true)}
              open={positiveOuverte}
            />
          </>
        ) : (
          <span>Merci pour votre retour !</span>
        )}
      </div>
    </div>
  );
};
