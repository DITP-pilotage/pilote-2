import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/server/framework/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { useAlbertConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";
import type { PropositionFormations } from "@/server/formations/queries/GetSlideInFormationsQuery";
import type { RecordSlideInActionCommand } from "@/server/formations/handlers/RecordSlideInActionHandler";

export function useSlideInFormations({
  peutAfficher,
}: {
  peutAfficher: boolean;
}): {
  slideIn: PropositionFormations | null;
  visible: boolean;
  masquer: () => void;
  fermer: () => void;
} {
  const utils = api.useUtils();
  const { data } = api.formation.slideIn.useQuery();
  const slideIn = data ?? null;
  // Pas de toast en cas d'échec : le routeur tRPC journalise l'erreur, et la
  // slide-in reviendra simplement à la prochaine visite.
  const { mutate } = api.formation.recordSlideInAction.useMutation({
    onSuccess: async (_resultat, { action }) => {
      if (action === "FERMETURE") {
        await utils.formation.slideIn.invalidate();
      }
    },
  });

  const { conversation, display } = useAlbertConversation();
  const assistantOuvert = conversation !== null && display !== "minimized";

  const [masquee, setMasquee] = useState(false);
  const visible =
    slideIn !== null && peutAfficher && !assistantOuvert && !masquee;

  const enregistrer = useCallback(
    (action: RecordSlideInActionCommand["action"]) => {
      if (slideIn === null) return;
      mutate({
        periodeId: slideIn.periodeId,
        action,
        csrf: récupérerUnCookie("csrf") ?? "",
      });
    },
    [mutate, slideIn],
  );

  const presentee = useRef(false);
  useEffect(() => {
    if (!visible || presentee.current) return;
    presentee.current = true;
    enregistrer("PRESENTATION");
  }, [visible, enregistrer]);

  // La croix et Échap masquent la slide-in jusqu'à la prochaine visite de l'accueil, sans rien enregistrer.
  const masquer = useCallback(() => setMasquee(true), []);

  const fermer = useCallback(() => {
    setMasquee(true);
    enregistrer("FERMETURE");
  }, [enregistrer]);

  return { slideIn, visible, masquer, fermer };
}
