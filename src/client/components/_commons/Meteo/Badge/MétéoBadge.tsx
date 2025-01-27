import { FunctionComponent } from 'react';
import { libellésMétéos, Météo } from '@/server/domain/météo/Météo.interface';
import Badge from '@/components/_commons/Badge/Badge';
import { BadgeType } from '@/components/_commons/Badge/Badge.interface';

interface MétéoBadgeProps {
  météo: Météo,
}

const badgeÀPartirDeLaMétéo: Record<Météo, BadgeType> = {
  'ORAGE': 'rouge',
  'NUAGE': 'jaune',
  'COUVERT': 'bleu',
  'SOLEIL': 'vert',
  'NON_NECESSAIRE': 'gris',
  'NON_RENSEIGNEE': 'gris',
};

const MétéoBadge: FunctionComponent<MétéoBadgeProps> = ({ météo }) => {
  return (
    <Badge type={badgeÀPartirDeLaMétéo[météo]}>
      {libellésMétéos[météo]}
    </Badge>
  );
};

export default MétéoBadge; 
