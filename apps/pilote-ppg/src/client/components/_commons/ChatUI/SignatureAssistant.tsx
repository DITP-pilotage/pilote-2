import { AlbertMonogramme } from "@/components/_commons/ChatUI/AlbertMonogramme";
import { PointsAttente } from "@/components/_commons/ChatUI/PointsAttente";
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
    <span className="font-bold text-dsfr-grey-50">Albert</span>
    {etat && (
      <>
        <span aria-live="polite">{LIBELLES_ETAT_ASSISTANT[etat]}</span>
        <PointsAttente />
      </>
    )}
  </div>
);
