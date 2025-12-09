/* eslint-disable react/iframe-missing-sandbox */
import { FunctionComponent, useRef } from "react";
import { useSession } from "next-auth/react";
import Modale__legacy from "@/components/_commons/Modale/Modale__legacy";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
const ID_HTML_MODALE_VIDEO_ACCUEIL = "modale-video-accueil";

export const ModaleVideoAccueil: FunctionComponent = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { data: session } = useSession();

  const desactiverVideoAccueil =
    api.utilisateur.desactiverVideoAccueil.useMutation();

  return (
    <Modale__legacy
      fermetureCallback={() => {
        if (session?.user.id) {
          if (iframeRef.current) {
            iframeRef.current.src = "";
          }
          desactiverVideoAccueil.mutate({
            csrf: récupérerUnCookie("csrf") ?? "",
            utilisateurId: session.user.id,
          });
        }
      }}
      idHtml={ID_HTML_MODALE_VIDEO_ACCUEIL}
      tailleModale="lg"
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
          <button
            aria-controls={ID_HTML_MODALE_VIDEO_ACCUEIL}
            className="fr-btn"
            title="Passer la vidéo"
            type="button"
          >
            Passer
          </button>
        </div>
      </div>
    </Modale__legacy>
  );
};
