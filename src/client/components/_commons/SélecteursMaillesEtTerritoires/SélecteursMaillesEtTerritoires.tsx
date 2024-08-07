import { FunctionComponent } from 'react';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import SélecteurMaille from './SélecteurMaille/SélecteurMaille';
import SélecteurTerritoire from './SélecteurTerritoire/SélecteurTerritoire';

interface SélecteursMaillesEtTerritoiresProps {
  chantierMailles?: Chantier['mailles'];
  estVisibleEnMobile: boolean;
  estVueMobile: boolean;
}

const SélecteursMaillesEtTerritoires: FunctionComponent<SélecteursMaillesEtTerritoiresProps> = ({ chantierMailles, estVisibleEnMobile, estVueMobile }) => {
  return (
    <>
      <SélecteurMaille
        estVisibleEnMobile={estVisibleEnMobile}
        estVueMobile={estVueMobile}
      />
      <SélecteurTerritoire 
        chantierMailles={chantierMailles}
        estVisibleEnMobile={estVisibleEnMobile}
        estVueMobile={estVueMobile}
      />
    </>
  );
};
export default SélecteursMaillesEtTerritoires;
