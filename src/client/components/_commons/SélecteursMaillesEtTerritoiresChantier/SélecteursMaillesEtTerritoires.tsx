import { FunctionComponent } from 'react';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import SélecteurMaille from './SélecteurMaille/SélecteurMaille';
import SélecteurTerritoire from './SélecteurTerritoire/SélecteurTerritoire';

interface SélecteursMaillesEtTerritoiresProps {
  chantierMailles?: Chantier['mailles'];
  territoireCode: string
  mailleSelectionnee: 'départementale' | 'régionale',
  estVueMobile: boolean,
  estVisibleEnMobile: boolean
  pathname: string
}

const SélecteursMaillesEtTerritoires: FunctionComponent<SélecteursMaillesEtTerritoiresProps> = ({
  chantierMailles,
  territoireCode,
  mailleSelectionnee,
  estVueMobile, 
  estVisibleEnMobile,
  pathname,
}) => {
  return (
    <>
      <SélecteurMaille
        mailleSelectionnee={mailleSelectionnee}
        pathname={pathname}
      />
      <SélecteurTerritoire
        chantierMailles={chantierMailles}
        estVisibleEnMobile={estVisibleEnMobile}
        estVueMobile={estVueMobile}
        mailleSelectionnee={mailleSelectionnee}
        pathname={pathname}
        territoireCode={territoireCode}
      />
    </>
  );
};

export default SélecteursMaillesEtTerritoires;
