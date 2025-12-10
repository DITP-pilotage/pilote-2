/* eslint-disable react/iframe-missing-sandbox */
import { FunctionComponent, useRef } from "react";
import { useSession } from "next-auth/react";
import { Dialog } from "radix-ui";
import { Modal } from "@/components/shared/Modal";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";

export const ModaleVideoAccueil: FunctionComponent<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ open, onOpenChange }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { data: session } = useSession();

  const desactiverVideoAccueil =
    api.utilisateur.desactiverVideoAccueil.useMutation();

  return (
    <Modal
      onOpenChange={(isOpen) => {
        if (!isOpen && session?.user.id) {
          if (iframeRef.current) {
            iframeRef.current.src = "";
          }
          desactiverVideoAccueil.mutate({
            csrf: récupérerUnCookie("csrf") ?? "",
            utilisateurId: session.user.id,
          });
        }
        onOpenChange(isOpen);
      }}
      open={open}
      title="Vidéo d'accueil"
      titleHidden
    >
      <div>
        <iframe
          height="620px"
          ref={iframeRef}
          sandbox="allow-scripts allow-same-origin"
          src="https://video.finances.gouv.fr/lecteur_video/keypub/0784da77311561a71a0a/id/5f49b5fa3c8fb3dab67cc7e0f5465a/type/pr/lang/fr"
          title="Vidéo d'accueil"
          width="100%"
        />
        <div className="fr-mt-4w flex justify-between gap-2">
          <p>
            Retrouvez cette vidéo et d'autres ressources dans le centre d'aide
            de PILOTE
          </p>
          <Dialog.Close asChild>
            <button
              className="fr-btn"
              title="Passer la vidéo"
              type="button"
            >
              Passer
            </button>
          </Dialog.Close>
        </div>
      </div>
    </Modal>
  );
};
