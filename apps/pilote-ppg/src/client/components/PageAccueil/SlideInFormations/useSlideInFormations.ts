import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/server/framework/trpc/api";
import { useAnalytics } from "@/client/analytics/useAnalytics";
import { useAlbertConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";
import type {
  FormationProposee,
  PropositionFormations,
} from "@/server/formations/queries/GetFormationsAProposerQuery";
import type { RecordSlideInActionCommand } from "@/server/formations/handlers/RecordSlideInActionHandler";
import { isSlideInHidden, writeHiddenSlideIn } from "./hiddenSlideInStorage";
import { inscriptionEvent, slideInEvent } from "./slideInEvents";

export function useSlideInFormations({
  peutAfficher,
}: {
  peutAfficher: boolean;
}): {
  slideIn: PropositionFormations | null;
  visible: boolean;
  masquer: () => void;
  fermer: () => void;
  trackInscription: (formation: FormationProposee) => void;
} {
  const utils = api.useUtils();
  const { trackEvent } = useAnalytics();
  const { data } = api.formation.formationsAProposer.useQuery();
  const slideIn = data ?? null;
  // Pas de toast en cas d'échec : le routeur tRPC journalise l'erreur, et la
  // slide-in reviendra simplement à la prochaine visite.
  const { mutate } = api.formation.recordSlideInAction.useMutation({
    onSuccess: async (_resultat, { action }) => {
      if (action === "FERMETURE") {
        await utils.formation.formationsAProposer.invalidate();
      }
    },
  });

  const { conversation, display } = useAlbertConversation();
  const assistantOuvert = conversation !== null && display !== "minimized";

  const { data: session } = useSession();
  const utilisateurId = session?.user.id;
  const [masquee, setMasquee] = useState(false);
  const masqueeDansLOnglet =
    slideIn !== null &&
    utilisateurId !== undefined &&
    isSlideInHidden({ utilisateurId, periodeId: slideIn.periode.id });
  const visible =
    slideIn !== null &&
    peutAfficher &&
    !assistantOuvert &&
    !masquee &&
    !masqueeDansLOnglet;

  const enregistrer = useCallback(
    (action: RecordSlideInActionCommand["action"]) => {
      if (slideIn === null) return;
      mutate({
        periodeId: slideIn.periode.id,
        action,
      });
    },
    [mutate, slideIn],
  );

  const presentee = useRef(false);
  useEffect(() => {
    if (!visible || slideIn === null || presentee.current) return;
    presentee.current = true;
    enregistrer("PRESENTATION");
    trackEvent(slideInEvent("view", slideIn.periode));
  }, [visible, slideIn, enregistrer, trackEvent]);

  // La croix et Échap masquent la slide-in jusqu'à la prochaine ouverture de PILOTE, sans rien écrire en base.
  const masquer = useCallback(() => {
    if (slideIn !== null) {
      trackEvent(slideInEvent("minimize", slideIn.periode));
      if (utilisateurId !== undefined) {
        writeHiddenSlideIn({ utilisateurId, periodeId: slideIn.periode.id });
      }
    }
    setMasquee(true);
  }, [slideIn, trackEvent, utilisateurId]);

  const fermer = useCallback(() => {
    if (slideIn !== null) trackEvent(slideInEvent("close", slideIn.periode));
    setMasquee(true);
    enregistrer("FERMETURE");
  }, [slideIn, trackEvent, enregistrer]);

  const trackInscription = useCallback(
    (formation: FormationProposee) => {
      if (slideIn !== null)
        trackEvent(inscriptionEvent(slideIn.periode, formation));
    },
    [slideIn, trackEvent],
  );

  return { slideIn, visible, masquer, fermer, trackInscription };
}
