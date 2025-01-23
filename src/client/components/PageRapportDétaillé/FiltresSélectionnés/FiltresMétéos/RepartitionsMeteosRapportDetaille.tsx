import { FunctionComponent } from 'react';
import { parseAsString, useQueryState } from 'nuqs';
import { libellésMétéos } from '@/server/domain/météo/Météo.interface';
import MeteoPicto from '@/components/_commons/Meteo/Picto/MeteoPicto';
import { RepartitionMeteoContrat } from '@/server/fiche-territoriale/app/contrats/RepartitionMeteoContrat';
import RepartitionsMeteosRapportDetailleStyled from './RepartitionsMeteosRapportDetailleStyled.styled';

interface RepartitionsMeteosRapportDetailleProps {
  repartitionMeteos: RepartitionMeteoContrat
}

const meteosAAfficher = ['ORAGE', 'NUAGE', 'COUVERT', 'SOLEIL'] as const;

const RepartitionsMeteosRapportDetaille : FunctionComponent<RepartitionsMeteosRapportDetailleProps> = ({ repartitionMeteos }) => {
  const [meteos] = useQueryState('meteos', parseAsString.withDefault('').withOptions({
    shallow: false,
    clearOnDefault: true,
    history: 'push',
  }));

  return (
    <RepartitionsMeteosRapportDetailleStyled className='fr-grid-row fr-mx-n3v'>
      {
        meteosAAfficher.map(meteo => (
          <li
            className='fr-col-3'
            key={libellésMétéos[meteo]}
            title={libellésMétéos[meteo]}
          >
            <button
              className={`bouton-repartition-meteos ${meteos.includes(meteo) ? 'est-active' : ''}`}
              disabled
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
    </RepartitionsMeteosRapportDetailleStyled>
  );
};

export default RepartitionsMeteosRapportDetaille;
