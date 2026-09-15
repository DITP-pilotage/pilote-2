import { AlbertMonogramme } from "@/components/_commons/ChatUI/AlbertMonogramme";
import { PointsAttente } from "@/components/_commons/ChatUI/PointsAttente";
import {
  LIBELLE_PREPARATION_REPONSE,
  NOM_ASSISTANT,
} from "@/components/_commons/ChatUI/libellesAssistant";

export const SignatureAssistant = ({
  enCoursDeGeneration,
}: {
  enCoursDeGeneration: boolean;
}) => (
  <div className="flex items-center gap-2 text-xs leading-5 text-dsfr-mention-grey">
    <AlbertMonogramme taille="sm" />
    {enCoursDeGeneration ? (
      <>
        <span aria-live="polite">{LIBELLE_PREPARATION_REPONSE}</span>
        <PointsAttente />
      </>
    ) : (
      <span className="font-bold text-dsfr-grey-50">{NOM_ASSISTANT}</span>
    )}
  </div>
);
