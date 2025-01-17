import { FunctionComponent, useCallback } from 'react';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { libellésMétéos, MétéoSaisissable } from '@/server/domain/météo/Météo.interface';
import { sauvegarderFiltres } from '@/client/stores/useFiltresStoreNew/useFiltresStoreNew';
import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import { RepartitionMeteoContrat } from '@/server/fiche-territoriale/app/contrats/RepartitionMeteoContrat';
import RepartitionsMeteosChantiersStyled from './RepartitionsMeteosChantiersStyled.styled';

export type RépartitionMétéos = Record<MétéoSaisissable, number>;

interface RepartitionsMeteosChantiersProps {
  météos: RepartitionMeteoContrat
}

const météosÀAfficher = ['ORAGE', 'NUAGE', 'COUVERT', 'SOLEIL'] as const;

const RepartitionsMeteosChantiers : FunctionComponent<RepartitionsMeteosChantiersProps> = ({ météos }) => {
  const [meteos, setMeteos] = useQueryState('meteos', parseAsString.withDefault('').withOptions({
    shallow: false,
    clearOnDefault: true,
    history: 'push',
  }));
  const [, setPagination] = useQueryState('pageIndex', parseAsInteger.withDefault(1).withOptions({
    shallow: false,
  }));

  const auClickCallback = useCallback(
    (météo: MétéoSaisissable) => {
      console.log('météo', météo);
      let arrMétéoFiltre = meteos.split(',').filter(Boolean);
      console.log('indexOf', arrMétéoFiltre.indexOf(météo));
      if (meteos.includes(météo)) {
        console.log('avant arrMétéoFiltre', arrMétéoFiltre);
        arrMétéoFiltre.splice(arrMétéoFiltre.indexOf(météo), 1);
        console.log('après arrMétéoFiltre', arrMétéoFiltre);
      } else {
        arrMétéoFiltre.push(météo);
      }
      setPagination(1);
      sauvegarderFiltres({ meteos: arrMétéoFiltre });
      return (setMeteos(arrMétéoFiltre.join(',')));
    }, 
    [meteos, setMeteos, setPagination],
  );

  return (
    <RepartitionsMeteosChantiersStyled className='fr-grid-row fr-mx-n3v'>
      {
        météosÀAfficher.map(météo => (
          <li
            className='fr-col-3'
            key={libellésMétéos[météo]}
          >
            <button
              className='bouton-repartition-meteos'
              onClick={() => auClickCallback(météo)}
              type='button'
            >
              <MétéoPicto
                météo={météo}
              />
              <p className='nombre-de-chantiers fr-h1 fr-mb-0'>
                {météos[météo]}
              </p>
              <p className='label fr-mb-0 break-keep'>
                {libellésMétéos[météo]}
              </p>
            </button>
            
          </li>
        ))
      }
    </RepartitionsMeteosChantiersStyled>
  );
};

export default RepartitionsMeteosChantiers;
