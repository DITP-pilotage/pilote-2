import { useSession } from "next-auth/react";
import { FunctionComponent } from "react";
import PageLanding from "@/components/PageLanding/PageLanding";
import Loader from "@/client/components/_commons/Loader/Loader";
import MiseEnPageStyled from "@/components/_commons/MiseEnPage/MiseEnPage.styled";
import { ClientOnly } from "@/components/shared/ClientOnly";
import { usePrefetchUtilisateurConnecte } from "@/client/hooks/usePrefetchUtilisateurConnecte";
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

  usePrefetchUtilisateurConnecte();

  return (
    <MiseEnPageStyled>
      <EnTete />
      {status === "loading" ? (
        <Loader />
      ) : (
        <div className="relative">
          {afficherLeLoader ? (
            <div className="toaster-chargement">
              <div className="progress">
                <div className="progress-bar-green" />
              </div>
              <p className="toaster-texte">
                Chargement des données en cours...
              </p>
            </div>
          ) : null}
          {status === "unauthenticated" ? (
            <PageLanding />
          ) : (
            <ClientOnly>
              <div id="main">{children}</div>
            </ClientOnly>
          )}
          <PiedDePage />
        </div>
      )}
    </MiseEnPageStyled>
  );
};

export default MiseEnPage;
