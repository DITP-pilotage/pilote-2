import { FunctionComponent, useCallback } from 'react';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { libellésMétéos, MétéoSaisissable, météosSaisissables } from '@/server/domain/météo/Météo.interface';
import { sauvegarderFiltres } from '@/client/stores/useFiltresStoreNew/useFiltresStoreNew';
import MeteoPicto from '@/components/_commons/Meteo/Picto/MeteoPicto';
import { RepartitionMeteoContrat } from '@/server/fiche-territoriale/app/contrats/RepartitionMeteoContrat';
import RepartitionsMeteosChantiersStyled from './RepartitionsMeteosChantiersStyled.styled';

interface RepartitionsMeteosChantiersProps {
  repartitionMeteos: RepartitionMeteoContrat
}

const RepartitionsMeteosChantiers : FunctionComponent<RepartitionsMeteosChantiersProps> = ({ repartitionMeteos }) => {
  const [meteos, setMeteos] = useQueryState('meteos', parseAsString.withDefault('').withOptions({
    shallow: false,
    clearOnDefault: true,
    history: 'push',
  }));
  
  const [, setPagination] = useQueryState('pageIndex', parseAsInteger.withDefault(1).withOptions({
    shallow: false,
  }));

  const auClickCallback = useCallback(
    (meteo: MétéoSaisissable) => {
      let arrMeteoFiltre = meteos.split(',').filter(Boolean);
      if (meteos.includes(meteo)) {
        arrMeteoFiltre.splice(arrMeteoFiltre.indexOf(meteo), 1);
      } else {
        arrMeteoFiltre.push(meteo);
      }
      setPagination(1);
      sauvegarderFiltres({ meteos: arrMeteoFiltre });
      return (setMeteos(arrMeteoFiltre.join(',')));
    }, 
    [meteos, setMeteos, setPagination],
  );

  return (
    <RepartitionsMeteosChantiersStyled className='fr-grid-row fr-mx-n3v'>
      {
        météosSaisissables.map(meteo => (
          <li
            className='fr-col-3 fr-p-2v'
            key={libellésMétéos[meteo]}
            title={libellésMétéos[meteo]}
          >
            <button
              className={`bouton-repartition-meteos ${meteos.includes(meteo) ? 'est-active' : ''}`}
              onClick={() => {auClickCallback(meteo);}}
              type='button'
            >
              <MeteoPicto
                meteo={meteo}
              />
              <p className='nombre-de-chantiers fr-h1 fr-mb-0'>
                {repartitionMeteos[meteo]}
              </p>
              <p className='label fr-mb-0 break-keep'>
                {libellésMétéos[meteo]}
              </p>
            </button>
          </li>
        ))
      }
    </RepartitionsMeteosChantiersStyled>
  );
};

export default RepartitionsMeteosChantiers;
