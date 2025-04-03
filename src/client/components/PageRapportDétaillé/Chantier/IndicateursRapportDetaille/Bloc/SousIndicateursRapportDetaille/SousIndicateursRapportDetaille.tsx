import { FunctionComponent } from 'react';
import { DétailsIndicateurs } from '@/server/chantiers/domain/DétailsIndicateur';
import Indicateur from '@/server/chantiers/domain/Indicateur';
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
