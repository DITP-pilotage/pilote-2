import { FunctionComponent } from 'react';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import SousIndicateurRapportDetailleBloc from './Bloc/SousIndicateurRapportDetailleBloc';

interface SousIndicateursProps {
  listeSousIndicateurs: Indicateur[]
  détailsIndicateurs: DétailsIndicateurs
  territoireCode: string
}


const SousIndicateursRapportDetaille: FunctionComponent<SousIndicateursProps> = ({
  listeSousIndicateurs,
  détailsIndicateurs,
  territoireCode,
}) => {

  const listeClassesCouleursFond = [
    'fr-background-contrast--grey',
    'fr-background-alt--grey',
  ];

  return (
    <>
      {
        listeSousIndicateurs.map((sousIndicateur, index) => (
          <SousIndicateurRapportDetailleBloc
            classeCouleurFond={listeClassesCouleursFond[index % 2]}
            détailsIndicateurs={détailsIndicateurs}
            indicateur={sousIndicateur}
            key={sousIndicateur.id}
            territoireCode={territoireCode}
          />
        ))
      }
    </>
  );
};

export default SousIndicateursRapportDetaille;
