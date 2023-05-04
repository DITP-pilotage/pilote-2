import MétéoBadgeProps, { BadgeType } from './Badge.interface';
import BadgeStyled from './Badge.styled';

const badgeÀPartirDuType: Record<BadgeType, string> = {
  'rouge': 'badge-rouge',
  'jaune': 'badge-jaune',
  'bleu': 'badge-bleu',
  'vert': 'badge-vert',
  'gris': 'badge-gris',
};

export default function Badge({ children, type }: MétéoBadgeProps) {
  return (
    <BadgeStyled className={`fr-badge fr-badge--no-icon ${badgeÀPartirDuType[type]} fr-mb-2w`}>
      { children }
    </BadgeStyled>
  );
}
