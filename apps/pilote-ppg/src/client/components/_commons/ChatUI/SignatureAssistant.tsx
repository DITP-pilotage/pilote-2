import { AlbertMonogramme } from "@/components/_commons/ChatUI/AlbertMonogramme";
import { PointsAttente } from "@/components/_commons/ChatUI/PointsAttente";
import {
  libelleActiviteAssistant,
  NOM_ASSISTANT,
} from "@/components/_commons/ChatUI/libellesAssistant";
import {
  LIBELLES_ETAT_ASSISTANT,
  type EtatAssistant,
} from "@/components/_commons/ChatUI/deriverEtatAssistant";

export const SignatureAssistant = ({
  etat,
}: {
  etat: EtatAssistant | null;
}) => (
  <div className="flex items-center gap-2 text-xs leading-5 text-dsfr-mention-grey">
    <AlbertMonogramme taille="sm" />
    {etat ? (
      <>
        <span aria-live="polite">
          {libelleActiviteAssistant(LIBELLES_ETAT_ASSISTANT[etat])}
        </span>
        <PointsAttente />
      </>
    ) : (
      <span className="font-bold text-dsfr-grey-50">{NOM_ASSISTANT}</span>
    )}
  </div>
);
