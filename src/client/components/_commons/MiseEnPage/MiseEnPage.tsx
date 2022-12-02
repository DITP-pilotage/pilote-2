import MiseEnPageProps from './MiseEnPage.interface';
import EnTête from './EnTête/EnTête';
import PiedDePage from './PiedDePage/PiedDePage';

export default function MiseEnPage({ children }: MiseEnPageProps) {
  return (
    <>
      <EnTête />
      {children}
      <PiedDePage />
    </>
  );
}