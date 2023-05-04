import { ReactNode } from 'react';

export type BadgeType = 'rouge' | 'jaune' | 'bleu' | 'vert' | 'gris';

export default interface MétéoBadgeProps {
  children: ReactNode,
  type: BadgeType,
}
