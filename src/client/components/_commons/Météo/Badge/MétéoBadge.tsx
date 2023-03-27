import météos from '@/client/constants/météos';
import MétéoBadgeProps from '@/components/_commons/Météo/Badge/MétéoBadge.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';

const badgeÀPartirDeLaMétéo: Record<Météo, string> = {
  'ORAGE': 'fr-badge--error',
  'NUAGE': 'fr-badge--warning',
  'COUVERT': 'fr-badge--info',
  'SOLEIL': 'fr-badge--success',
  'NON_NECESSAIRE': '',
  'NON_RENSEIGNEE': '',
};

export default function MétéoBadge({ météo }: MétéoBadgeProps) {
  return (
    <p className={`fr-badge fr-badge--no-icon ${badgeÀPartirDeLaMétéo[météo]} fr-mb-2w`}>
      {météos[météo]}
    </p>
  );
}
