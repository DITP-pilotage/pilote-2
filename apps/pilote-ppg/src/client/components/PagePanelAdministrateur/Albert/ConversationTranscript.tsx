import type { inferRouterOutputs } from "@trpc/server";
import type { appRouter } from "@/server/infrastructure/api/trpc/routes/routes";
import { AssistantMessageText } from "@/components/_commons/ChatUI/AssistantMessageText";
import { clsxm } from "@/utils/clsxm";

type DetailConversation = NonNullable<
  inferRouterOutputs<
    typeof appRouter
  >["albert"]["admin"]["recupererConversation"]
>;
type LlmCall = DetailConversation["llmCalls"][number];

type MessagePart = { type: string; text?: string };
type UIMessageMinimal = {
  id?: string;
  role: "user" | "assistant" | "system";
  parts: MessagePart[];
};

const extraireTexte = (message: UIMessageMinimal): string =>
  message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("\n");

const BadgeEvaluation = ({ llmCall }: { llmCall: LlmCall }) => {
  if (!llmCall.evaluation) return null;
  return (
    <span
      className={clsxm(
        "!inline-block !px-2 !py-0.5 !rounded !text-xs !font-medium",
        llmCall.evaluation === "POSITIVE"
          ? "!bg-green-100 !text-green-800"
          : "!bg-red-100 !text-red-800",
      )}
    >
      {llmCall.evaluation === "POSITIVE" ? "👍 Positif" : "👎 Négatif"}
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
  let indexAssistant = 0;
  const messagesNormalises = messages as unknown as UIMessageMinimal[];

  return (
    <div className="!space-y-4">
      {messagesNormalises.map((message, index) => {
        if (message.role === "user") {
          return (
            <div className="!flex !justify-end" key={message.id ?? index}>
              <div className="!max-w-[80%] !bg-dsfr-blue-france-sun-113 !text-white !rounded-lg !px-4 !py-2 !text-sm">
                {extraireTexte(message)}
              </div>
            </div>
          );
        }
        if (message.role === "assistant") {
          const llmCall = llmCalls[indexAssistant];
          indexAssistant += 1;
          const texte = extraireTexte(message);
          return (
            <div className="!flex !flex-col !gap-2" key={message.id ?? index}>
              <div className="!flex !items-start !gap-2">
                <div className="!flex-1 !bg-gray-50 !rounded-lg !px-4 !py-3 !text-sm">
                  <AssistantMessageText text={texte} />
                </div>
                {llmCall && <BadgeEvaluation llmCall={llmCall} />}
              </div>
              {llmCall?.commentaire && (
                <blockquote className="!ml-4 !border-l-4 !border-gray-300 !pl-3 !text-sm !text-gray-700 !italic">
                  <div className="!text-xs !font-semibold !text-gray-500 !mb-1 !not-italic">
                    Commentaire de l'utilisateur
                  </div>
                  {llmCall.commentaire}
                </blockquote>
              )}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};
