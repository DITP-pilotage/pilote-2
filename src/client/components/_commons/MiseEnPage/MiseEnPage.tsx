import { useSession } from 'next-auth/react';
import PageLanding from '@/components/PageLanding/PageLanding';
import Loader from '@/client/components/_commons/Loader/Loader';
import MiseEnPageProps from './MiseEnPage.interface';
import EnTête from './EnTête/EnTête';
import PiedDePage from './PiedDePage/PiedDePage';
import MiseEnPageStyled from './MiseEnPageStyled';

export default function MiseEnPage({ children }: MiseEnPageProps) {
  const { status } = useSession();

  if (status === 'loading') 
    return (
      <MiseEnPageStyled className='fr-grid-row fr-grid-row--center fr-grid-row--middle'>
        <Loader />
      </MiseEnPageStyled>
    );
    
  return (
    <>
      <EnTête />
      {status === 'unauthenticated' ? <PageLanding /> : children}
      <PiedDePage />
    </>
  );
}
