import { useSession } from "next-auth/react";
import { FunctionComponent, useCallback, useMemo, useState } from "react";
import PageLanding from "@/components/PageLanding/PageLanding";
import Loader from "@/client/components/_commons/Loader/Loader";
import MiseEnPageStyled from "@/components/_commons/MiseEnPage/MiseEnPage.styled";
import api from "@/server/infrastructure/api/trpc/api";
import { actionsTerritoiresStore } from "@/stores/useTerritoiresStore/useTerritoiresStore";
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

  const {
    initialiserLesTerritoires,
    initialiserLeTerritoireSélectionnéParDéfaut,
  } = actionsTerritoiresStore();
  const [aFiniDeChargerLesTerritoires, setAFiniDeChargerLesTerritoires] =
    useState(false);
  const { refetch: fetchRécupérerLesTerritoires } =
    api.territoire.récupérerTous.useQuery(undefined, {
      refetchOnWindowFocus: false,
      enabled: false,
    });

  const récupérerLesTerritoires = useCallback(async () => {
    const { data: territoires } = await fetchRécupérerLesTerritoires();
    if (territoires) {
      initialiserLesTerritoires(territoires);
      initialiserLeTerritoireSélectionnéParDéfaut();
      setAFiniDeChargerLesTerritoires(true);
    }
  }, [
    fetchRécupérerLesTerritoires,
    initialiserLesTerritoires,
    initialiserLeTerritoireSélectionnéParDéfaut,
  ]);

  useMemo(() => {
    if (status === "authenticated") {
      récupérerLesTerritoires();
    }
  }, [récupérerLesTerritoires, status]);

  return (
    <MiseEnPageStyled>
      <EnTete />
      {status === "loading" ||
      (status === "authenticated" && !aFiniDeChargerLesTerritoires) ? (
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
          {status === "unauthenticated" ? <PageLanding /> : children}
          <PiedDePage />
        </div>
      )}
    </MiseEnPageStyled>
  );
};

export default MiseEnPage;
