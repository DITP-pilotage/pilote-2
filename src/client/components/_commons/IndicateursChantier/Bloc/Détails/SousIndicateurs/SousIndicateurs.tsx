import { FunctionComponent } from 'react';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { CartographieIndicateurType } from '@/client/components/_commons/IndicateursChantier/Bloc/Détails/IndicateurDétails';
import SousIndicateurBloc from './Bloc/SousIndicateurBloc';

interface SousIndicateursProps {
  listeSousIndicateurs: Indicateur[]
  détailsIndicateurs: DétailsIndicateurs
  detailsIndicateursTerritoire: DétailsIndicateurs
  chantierEstTerritorialisé: boolean
  estInteractif: boolean
  territoireCode: string
  territoiresCompares: string[]
  mailleQuery: MailleInterne
  mailleSelectionnee: MailleInterne
  mailsDirecteursProjets: string[]
  jalon: number
  cartographieDroiteIndicateur: CartographieIndicateurType
  cartographieGaucheIndicateur: CartographieIndicateurType
}


const SousIndicateurs: FunctionComponent<SousIndicateursProps> = ({
  listeSousIndicateurs,
  chantierEstTerritorialisé,
  détailsIndicateurs,
  detailsIndicateursTerritoire,
  estInteractif,
  territoireCode,
  territoiresCompares,
  mailleQuery,
  jalon,
  mailleSelectionnee,
  mailsDirecteursProjets,
  cartographieDroiteIndicateur,
  cartographieGaucheIndicateur,
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
            cartographieDroiteIndicateur={cartographieDroiteIndicateur}
            cartographieGaucheIndicateur={cartographieGaucheIndicateur}
            chantierEstTerritorialisé={chantierEstTerritorialisé}
            classeCouleurFond={listeClassesCouleursFond[index % 2]}
            detailsIndicateursTerritoire={detailsIndicateursTerritoire}
            détailsIndicateurs={détailsIndicateurs}
            estInteractif={estInteractif}
            indicateur={sousIndicateur}
            jalon={jalon}
            key={sousIndicateur.id}
            mailleQuery={mailleQuery}
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
