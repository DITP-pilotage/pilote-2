import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import PageLanding from '@/components/PageLanding/PageLanding';
import Loader from '@/client/components/_commons/Loader/Loader';
import MiseEnPageProps from './MiseEnPage.interface';
import EnTête from './EnTête/EnTête';
import PiedDePage from './PiedDePage/PiedDePage';
import MiseEnPageStyled from './MiseEnPageStyled';

export default function MiseEnPage({ afficherLeLoader, children }: MiseEnPageProps) {
  const { status } = useSession();

  useEffect(() => {
    if (status === 'loading' || afficherLeLoader) 
      window.scrollTo(0, 0);
  }, [afficherLeLoader, status]);

  return (
    <>
      <EnTête />
      {
        status === 'loading' || afficherLeLoader 
          ?
            <MiseEnPageStyled className='fr-grid-row fr-grid-row--center fr-grid-row--middle'>
              <Loader />
            </MiseEnPageStyled>
          :
          (status === 'unauthenticated' ? <PageLanding /> : children)
      }
      <PiedDePage />
    </>
  );
}
