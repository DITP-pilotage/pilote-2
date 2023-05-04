import météos from '@/client/constants/météos';
import MétéoBadgeProps from '@/components/_commons/Météo/Badge/MétéoBadge.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import Badge from '@/components/_commons/Badge/Badge';
import { BadgeType } from '@/components/_commons/Badge/Badge.interface';

const badgeÀPartirDeLaMétéo: Record<Météo, BadgeType> = {
  'ORAGE': 'rouge',
  'NUAGE': 'jaune',
  'COUVERT': 'bleu',
  'SOLEIL': 'vert',
  'NON_NECESSAIRE': 'gris',
  'NON_RENSEIGNEE': 'gris',
};

export default function MétéoBadge({ météo }: MétéoBadgeProps) {
  return (
    <Badge type={badgeÀPartirDeLaMétéo[météo]}>
      {météos[météo]}
    </Badge>
  );
}
