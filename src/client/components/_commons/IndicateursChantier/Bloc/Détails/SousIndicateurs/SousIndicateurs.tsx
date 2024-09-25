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
  territoiresCompares: string[]
  mailleSelectionnee: MailleInterne
  mailsDirecteursProjets: string[]
}


const SousIndicateurs: FunctionComponent<SousIndicateursProps> = ({
  listeSousIndicateurs,
  chantierEstTerritorialisé,
  détailsIndicateurs,
  detailsIndicateursTerritoire,
  estInteractif,
  territoireCode,
  territoiresCompares,
  mailleSelectionnee,
  mailsDirecteursProjets,
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
            estInteractif={estInteractif}
            indicateur={sousIndicateur}
            key={sousIndicateur.id}
            mailleSelectionnee={mailleSelectionnee}
            mailsDirecteursProjets={mailsDirecteursProjets}
            territoireCode={territoireCode}
            territoiresCompares={territoiresCompares}
          />
        ))
      }
    </>
  );
};

export default SousIndicateurs;
