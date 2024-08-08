import { FunctionComponent } from 'react';
import MétéoBadgeProps, { BadgeType } from './Badge.interface';
import BadgeStyled from './Badge.styled';

const badgeÀPartirDuType: Record<BadgeType, string> = {
  'rouge': 'badge-rouge',
  'jaune': 'badge-jaune',
  'bleu': 'badge-bleu',
  'vert': 'badge-vert',
  'gris': 'badge-gris',
};

const Badge: FunctionComponent<MétéoBadgeProps> = ({ children, type }) => {
  return (
    <BadgeStyled className={`fr-badge fr-badge--no-icon ${badgeÀPartirDuType[type]}`}>
      { children }
    </BadgeStyled>
  );
};

export default Badge;
