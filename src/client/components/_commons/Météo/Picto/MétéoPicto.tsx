import pictoSoleil from '/public/img/météo/soleil.svg';
import pictoCouvert from '/public/img/météo/couvert.svg';
import pictoNuage from '/public/img/météo/nuage.svg';
import pictoOrage from '/public/img/météo/orage.svg';
import Image from 'next/image';
import { libellésMétéos, Météo } from '@/server/domain/météo/Météo.interface';
import { FunctionComponent } from 'react';

interface MétéoPictoProps {
  météo: Météo,
  estVisibleParLecteurDÉcran?: boolean,
}

export const météosPictos: Record<Météo, any> = {
  'ORAGE': pictoOrage,
  'NUAGE': pictoNuage,
  'COUVERT': pictoCouvert,
  'SOLEIL': pictoSoleil,
  'NON_RENSEIGNEE': null,
  'NON_NECESSAIRE': null,
};

const MétéoPicto: FunctionComponent<MétéoPictoProps> = ({ météo, estVisibleParLecteurDÉcran = false }) => {
  return météosPictos[météo] !== null ? (
    <Image
      alt={estVisibleParLecteurDÉcran ? libellésMétéos[météo] : ''}
      aria-hidden={estVisibleParLecteurDÉcran ? undefined : 'true'}
      className='météo-picto'
      src={météosPictos[météo]}
    />
  ) : null;
};

export default MétéoPicto;
