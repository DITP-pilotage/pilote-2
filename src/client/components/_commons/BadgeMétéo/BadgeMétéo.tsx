import météos from '@/client/constants/météos';
import BadgeMétéoProps from '@/components/_commons/BadgeMétéo/BadgeMétéo.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';

const badgeÀPartirDeLaMétéo: Record<Météo, string> = {
  'ORAGE': 'fr-badge--error',
  'NUAGE': 'fr-badge--warning',
  'COUVERT': 'fr-badge--info',
  'SOLEIL': 'fr-badge--success',
  'NON_NECESSAIRE': '',
  'NON_RENSEIGNEE': '',
};

export default function BadgeMétéo({ météo, className = '' }: BadgeMétéoProps) {
  return (
    <p className={`fr-badge fr-badge--no-icon ${badgeÀPartirDeLaMétéo[météo]} ${className}`}>
      {météos[météo]}
    </p>
  );
}
