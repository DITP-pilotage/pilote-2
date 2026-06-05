import { $Enums } from "@prisma/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { appRouter } from "@/server/infrastructure/api/trpc/routes/routes";
import { AssistantMessage } from "@/components/_commons/ChatUI/AssistantMessage";
import { LIBELLES_CATEGORIES } from "@/components/_commons/ChatUI/feedbackCategories";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { clsxm } from "@/utils/clsxm";

type DetailConversation = NonNullable<
  inferRouterOutputs<
    typeof appRouter
  >["albert"]["conversations"]["recupererPourAdmin"]
>;
type LlmCall = DetailConversation["llmCalls"][number];

type Tour = {
  question: string | null;
  reponse: PiloteUIMessage | null;
  llmCall: LlmCall | undefined;
};

const extraireTexteUser = (message: PiloteUIMessage): string =>
  message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("\n")
    .trim();

const grouperParTour = (
  messages: PiloteUIMessage[],
  llmCalls: LlmCall[],
): Tour[] => {
  const tours: Tour[] = [];
  let questionEnCours: string | null = null;
  let indexAssistant = 0;

  for (const message of messages) {
    if (message.role === "user") {
      if (questionEnCours !== null) {
        tours.push({
          question: questionEnCours,
          reponse: null,
          llmCall: undefined,
        });
      }
      questionEnCours = extraireTexteUser(message);
    } else if (message.role === "assistant") {
      tours.push({
        question: questionEnCours,
        reponse: message,
        llmCall: llmCalls[indexAssistant],
      });
      indexAssistant += 1;
      questionEnCours = null;
    }
  }

  if (questionEnCours !== null) {
    tours.push({
      question: questionEnCours,
      reponse: null,
      llmCall: undefined,
    });
  }

  return tours;
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="text-xs font-semibold uppercase tracking-wider text-dsfr-mention-grey mb-2">
    {children}
  </div>
);

const BadgeEvaluation = ({
  evaluation,
}: {
  evaluation: LlmCall["evaluation"];
}) => {
  if (!evaluation) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-dsfr-mention-grey">
        Sans évaluation
      </span>
    );
  }
  const estPositif = evaluation === $Enums.llm_call_evaluation.POSITIVE;
  return (
    <span
      className={clsxm(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium",
        estPositif
          ? "bg-dsfr-success-425/10 text-dsfr-success-425"
          : "bg-dsfr-warning-950 text-dsfr-warning-425",
      )}
    >
      <span aria-hidden>{estPositif ? "👍" : "👎"}</span>
      L&apos;utilisateur a évalué le résultat de ce prompt comme{" "}
      {estPositif ? "positif" : "négatif"}
    </span>
  );
};

type ConversationTranscriptProps = {
  messages: DetailConversation["messages"];
  llmCalls: LlmCall[];
};

export const ConversationTranscript = ({
  messages,
  llmCalls,
}: ConversationTranscriptProps) => {
  const tours = grouperParTour(messages, llmCalls);

  return (
    <div className="divide-y divide-dsfr-grey-925">
      {tours.map((tour, index) => (
        <article className="py-8 first:pt-0 last:pb-0" key={index}>
          {tour.question !== null && (
            <div className="flex flex-col items-end gap-1.5 mb-5">
              <div className="max-w-[80%] bg-dsfr-blue-france-sun-113 text-white rounded-lg rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                {tour.question}
              </div>
              {tour.llmCall && (
                <BadgeEvaluation evaluation={tour.llmCall.evaluation} />
              )}
            </div>
          )}

          {tour.reponse !== null && (
            <div className="mb-5">
              <AssistantMessage message={tour.reponse} isStreaming={false} />
            </div>
          )}

          {tour.llmCall?.commentaire && (
            <section className="bg-dsfr-warning-950/50 border-l-2 border-dsfr-warning-425 px-4 py-3 rounded-sm">
              <Label>Commentaire de l&apos;utilisateur</Label>
              <p className="text-sm text-dsfr-grey-50 italic whitespace-pre-wrap">
                « {tour.llmCall.commentaire} »
              </p>
            </section>
          )}

          {tour.llmCall?.categoriesProbleme &&
            tour.llmCall.categoriesProbleme.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tour.llmCall.categoriesProbleme.map((categorie) => (
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-medium bg-dsfr-warning-950 text-dsfr-warning-425"
                    key={categorie}
                  >
                    {LIBELLES_CATEGORIES[categorie]}
                  </span>
                ))}
              </div>
            )}
        </article>
      ))}
    </div>
  );
};
