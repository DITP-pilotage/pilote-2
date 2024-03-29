import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import PageLanding from '@/components/PageLanding/PageLanding';
import Loader from '@/client/components/_commons/Loader/Loader';
import MiseEnPageStyled from '@/components/_commons/MiseEnPage/MiseEnPage.styled';
import api from '@/server/infrastructure/api/trpc/api';
import { actionsTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import MiseEnPageProps from './MiseEnPage.interface';
import EnTête from './EnTête/EnTête';
import PiedDePage from './PiedDePage/PiedDePage';

export default function MiseEnPage({ afficherLeLoader, children }: MiseEnPageProps) {
  const { status } = useSession();
  const { initialiserLesTerritoires, initialiserLeTerritoireSélectionnéParDéfaut } = actionsTerritoiresStore();
  const [aFiniDeChargerLesTerritoires, setAFiniDeChargerLesTerritoires] = useState(false);
  const { refetch: fetchRécupérerLesTerritoires } = api.territoire.récupérerTous.useQuery(undefined, { refetchOnWindowFocus: false, enabled: false });
  
  const récupérerLesTerritoires = async () => {
    const { data: territoires } = await fetchRécupérerLesTerritoires();
    if (territoires) {
      initialiserLesTerritoires(territoires);
      initialiserLeTerritoireSélectionnéParDéfaut();
      setAFiniDeChargerLesTerritoires(true);
    }
  };

  useEffect(() => {
    if (status === 'loading' || afficherLeLoader) 
      window.scrollTo(0, 0);
    if (status === 'authenticated') {
      récupérerLesTerritoires();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [afficherLeLoader, status]);

  return (
    <MiseEnPageStyled>
      <EnTête />
      {
        status === 'loading' || afficherLeLoader ||  (status === 'authenticated' && !aFiniDeChargerLesTerritoires)
          ?
            <Loader />
          : (
            <>
              {
                status === 'unauthenticated' ? <PageLanding /> : children
              }
              <PiedDePage />
            </>
          )
      }
    </MiseEnPageStyled>
  );
}
