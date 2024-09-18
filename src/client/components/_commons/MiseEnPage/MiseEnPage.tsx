import { useSession } from 'next-auth/react';
import { FunctionComponent, useCallback, useMemo, useState } from 'react';
import PageLanding from '@/components/PageLanding/PageLanding';
import MiseEnPageStyled from '@/components/_commons/MiseEnPage/MiseEnPage.styled';
import api from '@/server/infrastructure/api/trpc/api';
import { actionsTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import EnTête from './EnTête/EnTête';
import PiedDePage from './PiedDePage/PiedDePage';

interface MiseEnPageProps {
  afficherLeLoader: boolean
  children: React.ReactNode
}

const MiseEnPage: FunctionComponent<MiseEnPageProps> = ({ afficherLeLoader, children }) => {
  const { status } = useSession();
  const { initialiserLesTerritoires, initialiserLeTerritoireSélectionnéParDéfaut } = actionsTerritoiresStore();
  const [aFiniDeChargerLesTerritoires, setAFiniDeChargerLesTerritoires] = useState(false);
  const { refetch: fetchRécupérerLesTerritoires } = api.territoire.récupérerTous.useQuery(undefined, {
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
  }, [fetchRécupérerLesTerritoires, initialiserLesTerritoires, initialiserLeTerritoireSélectionnéParDéfaut]);

  useMemo(() => {
    if (status === 'authenticated') {
      récupérerLesTerritoires();
    }
  }, [récupérerLesTerritoires, status]);

  return (
    <MiseEnPageStyled>
      <EnTête />
      <>
        {
          status === 'unauthenticated' ? <PageLanding /> : (
            <>
              {
                status === 'loading' || afficherLeLoader
                  ?
                    <div style={{
                      position: 'fixed',
                      backgroundColor: 'wheat',
                      bottom: '2rem',
                      right: '4rem',
                      display: 'flex',
                      padding: '2rem',
                      alignItems: 'center',
                      height: '2rem',
                      zIndex: '1000',
                    }}
                    >
                      Chargement en cours...
                    </div>
                  : null
              }
              {aFiniDeChargerLesTerritoires ? children : null}
            </>
          )
        }
        <PiedDePage />
      </>
    </MiseEnPageStyled>
  );
};

export default MiseEnPage;
