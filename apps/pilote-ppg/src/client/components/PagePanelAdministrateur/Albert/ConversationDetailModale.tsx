import { $Enums } from "@prisma/client";
import { DateTime } from "luxon";
import { useRef } from "react";
import { toast } from "sonner";
import { api } from "@/server/framework/trpc/api";
import { ConversationTranscript } from "@/components/PagePanelAdministrateur/Albert/ConversationTranscript";
import { Modale } from "@/components/shared/Modale";
import { Button } from "@/components/shared/Button";
import { Icone } from "@/components/_commons/Icone";
import { FileTextIcon } from "@/components/_commons/Icones/FileTextIcon";
import { imprimer } from "@/components/_commons/ChatUI/imprimer";
import { nomConversation } from "@/components/PagePanelAdministrateur/Albert/exporterConversation";

type ConversationDetailModaleProps = {
  id: string;
  onClose: () => void;
};

const formatterDateLongue = (date: Date) =>
  DateTime.fromJSDate(date)
    .setZone("Europe/Paris")
    .setLocale("fr")
    .toFormat("d LLLL yyyy 'à' HH:mm");

const ChipMeta = ({
  label,
  valeur,
}: {
  label: string;
  valeur: React.ReactNode;
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-dsfr-mention-grey">
      {label}
    </span>
    <span className="text-sm text-dsfr-grey-50">{valeur}</span>
  </div>
);

const Stat = ({
  label,
  valeur,
  icone,
}: {
  label: string;
  valeur: number;
  icone: string;
}) => (
  <div className="flex items-center gap-2 px-3 py-1.5 bg-dsfr-grey-1000 rounded-sm">
    <span aria-hidden className="text-base">
      {icone}
    </span>
    <span className="text-sm font-medium text-dsfr-grey-50">{valeur}</span>
    <span className="text-xs text-dsfr-mention-grey">{label}</span>
  </div>
);

export const ConversationDetailModale = ({
  id,
  onClose,
}: ConversationDetailModaleProps) => {
  const { data, isLoading } =
    api.albert.conversations.recupererPourAdmin.useQuery({ id });
  const conversationRef = useRef<HTMLDivElement>(null);

  const nbPouce =
    data?.llmCalls.filter(
      (call) => call.evaluation === $Enums.llm_call_evaluation.POSITIVE,
    ).length ?? 0;
  const nbPouceBas =
    data?.llmCalls.filter(
      (call) => call.evaluation === $Enums.llm_call_evaluation.NEGATIVE,
    ).length ?? 0;
  const nbCommentaires =
    data?.llmCalls.filter((call) => call.commentaire !== null).length ?? 0;

  return (
    <Modale
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      open
      size="xl"
      title={data?.titre || "Sans titre"}
    >
      {isLoading && (
        <div className="text-sm text-dsfr-mention-grey">Chargement…</div>
      )}
      {!isLoading && !data && (
        <div className="text-sm text-dsfr-mention-grey">
          Conversation introuvable.
        </div>
      )}
      {!isLoading && data && (
        <div ref={conversationRef}>
          <div className="mb-4 flex justify-end">
            <Button
              iconLeft={
                <Icone className="h-4 w-4 text-current" icone={FileTextIcon} />
              }
              onClick={() => {
                const conversation = conversationRef.current;
                if (conversation === null) return;
                imprimer({
                  contenu: conversation,
                  titre: nomConversation({
                    titre: data.titre,
                    createdAt: data.createdAt,
                  }),
                  entete: data.titre || "Sans titre",
                }).catch(() => toast.error("Le PDF n'a pas pu être préparé"));
              }}
              size="sm"
              variant="secondary"
            >
              Télécharger en PDF
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-5 mb-6 border-b border-dsfr-grey-925">
            <ChipMeta label="Profil" valeur={data.utilisateur.profilNom} />
            <ChipMeta label="Tours" valeur={`${data.llmCalls.length}`} />
            <ChipMeta
              label="Créée le"
              valeur={formatterDateLongue(data.createdAt)}
            />
            <ChipMeta
              label="Mise à jour"
              valeur={formatterDateLongue(data.updatedAt)}
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            <Stat icone="👍" label="positifs" valeur={nbPouce} />
            <Stat icone="👎" label="négatifs" valeur={nbPouceBas} />
            <Stat icone="💬" label="commentaires" valeur={nbCommentaires} />
          </div>

          <ConversationTranscript
            llmCalls={data.llmCalls}
            messages={data.messages}
          />
        </div>
      )}
    </Modale>
  );
};
