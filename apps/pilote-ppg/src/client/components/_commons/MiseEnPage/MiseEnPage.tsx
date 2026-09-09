import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { FunctionComponent } from "react";
import PageLanding from "@/components/PageLanding/PageLanding";
import Loader from "@/client/components/_commons/Loader/Loader";
import { ClientOnly } from "@/components/shared/ClientOnly";
import { usePrefetchUtilisateurConnecte } from "@/client/hooks/usePrefetchUtilisateurConnecte";
import { CHEMIN_CONNEXION } from "@/server/authentification/domain/cheminsAuthentification";
import { AlbertConversationProvider } from "@/components/_commons/ChatUI/AlbertConversationProvider";
import { AlbertOverlay } from "@/components/_commons/ChatUI/AlbertOverlay";
import { EnTete } from "./EnTete/EnTete";
import PiedDePage from "./PiedDePage/PiedDePage";

interface MiseEnPageProps {
  afficherLeLoader: boolean;
  children: React.ReactNode;
}

const MiseEnPage: FunctionComponent<MiseEnPageProps> = ({
  afficherLeLoader,
  children,
}) => {
  const { status } = useSession();
  const { pathname } = useRouter();
  // L'écran de choix du mode de connexion doit s'afficher pour un visiteur non
  // authentifié, là où toute autre page laisse la place à la landing.
  const estPageDeConnexion = pathname === CHEMIN_CONNEXION;

  usePrefetchUtilisateurConnecte();

  return (
    <div className="flex min-h-screen flex-col break-words [&_main]:grow [&_main]:bg-dsfr-alt-blue-france [&_main_h1]:text-primary print:[&_.barre-latérale]:hidden print:[&_.fr-btn]:hidden print:[&_.fr-link]:hidden print:[&_*]:scrollbar-none print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact] print:[&_main]:!bg-white">
      <EnTete />
      {status === "loading" ? (
        <Loader />
      ) : (
        <div className="relative flex grow flex-col">
          {afficherLeLoader ? (
            <div className="fixed right-16 bottom-16 z-[1751] w-80 bg-dsfr-grey-1000 [filter:drop-shadow(var(--overlap-shadow))] shadow-[inset_0_0_0_1px_theme(colors.dsfr-grey-900)]">
              <div className="relative w-full h-[0.4em] bg-pilote-loader-bg">
                <div className="relative h-full bg-pilote-loader-green bg-[size:23em_0.25em] animate-cssload-width" />
              </div>
              <p className="p-4 m-0">Chargement des données en cours...</p>
            </div>
          ) : null}
          {status === "unauthenticated" && !estPageDeConnexion ? (
            <PageLanding />
          ) : (
            <ClientOnly>
              <AlbertConversationProvider>
                <div className="flex grow flex-col" id="main">
                  {children}
                </div>
                <AlbertOverlay />
              </AlbertConversationProvider>
            </ClientOnly>
          )}
          <ClientOnly>
            <PiedDePage />
          </ClientOnly>
        </div>
      )}
    </div>
  );
};

export default MiseEnPage;
