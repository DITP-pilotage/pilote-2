import pictoSoleil from '/public/img/météo/soleil.svg';
import pictoCouvert from '/public/img/météo/couvert.svg';
import pictoNuage from '/public/img/météo/nuage.svg';
import pictoOrage from '/public/img/météo/orage.svg';
import Image from 'next/image';
import MétéoPictoProps from './MétéoPicto.interface';
import météos from '@/client/constants/météos';
import { Météo } from '@/server/domain/météo/Météo.interface';

export const météosPictos: Record<Météo, any> = {
  'ORAGE': pictoOrage,
  'NUAGE': pictoNuage,
  'COUVERT': pictoCouvert,
  'SOLEIL': pictoSoleil,
  'NON_RENSEIGNEE': null,
  'NON_NECESSAIRE': null,
};

export default function MétéoPicto({ météo }: MétéoPictoProps) {
  return météosPictos[météo] !== null ? (
    <Image
      alt={météos[météo]}
      className="météo-picto"
      src={météosPictos[météo]}
    />
  ) : null;
}
