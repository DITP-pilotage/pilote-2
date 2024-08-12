import { FunctionComponent } from 'react';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import SousIndicateurBloc from './Bloc/SousIndicateurBloc';

interface SousIndicateursProps {
  listeSousIndicateurs: Indicateur[]
  détailsIndicateurs: DétailsIndicateurs
  detailsIndicateursTerritoire: DétailsIndicateurs
  chantierEstTerritorialisé: boolean
  estInteractif: boolean
  territoireCode: string
  mailleSelectionnee: MailleInterne
}


const SousIndicateurs: FunctionComponent<SousIndicateursProps> = ({
  listeSousIndicateurs,
  chantierEstTerritorialisé,
  détailsIndicateurs,
  detailsIndicateursTerritoire,
  estInteractif,
  territoireCode,
  mailleSelectionnee,
}) => {

  const listeClassesCouleursFond = [
    'fr-background-contrast--grey',
    'fr-background-alt--grey',
  ];

  return (
    <>
      {
        listeSousIndicateurs.map((sousIndicateur, index) => (
          <SousIndicateurBloc
            chantierEstTerritorialisé={chantierEstTerritorialisé}
            classeCouleurFond={listeClassesCouleursFond[index % 2]}
            detailsIndicateursTerritoire={detailsIndicateursTerritoire}
            détailsIndicateurs={détailsIndicateurs}
            estDisponibleALImport={false}
            estInteractif={estInteractif}
            indicateur={sousIndicateur}
            key={sousIndicateur.id}
            mailleSelectionnee={mailleSelectionnee}
            territoireCode={territoireCode}
          />
        ))
      }
    </>
  );
};

export default SousIndicateurs;
