import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import PageLanding from '@/components/PageLanding/PageLanding';
import Loader from '@/client/components/_commons/Loader/Loader';
import MiseEnPageStyled from '@/components/_commons/MiseEnPage/MiseEnPage.styled';
import MiseEnPageProps from './MiseEnPage.interface';
import EnTête from './EnTête/EnTête';
import PiedDePage from './PiedDePage/PiedDePage';

export default function MiseEnPage({ afficherLeLoader, children }: MiseEnPageProps) {
  const { status } = useSession();

  useEffect(() => {
    if (status === 'loading' || afficherLeLoader) 
      window.scrollTo(0, 0);
  }, [afficherLeLoader, status]);

  return (
    <MiseEnPageStyled>
      <EnTête />
      {
        status === 'loading' || afficherLeLoader 
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
