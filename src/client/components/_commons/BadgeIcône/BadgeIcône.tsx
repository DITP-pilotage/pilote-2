import '@gouvfr/dsfr/dist/component/badge/badge.min.css';
import { FunctionComponent } from 'react';
import BadgeIcôneStyled from '@/components/_commons/BadgeIcône/BadgeIcône.styled';

interface BadgeIcôneProps {
  type: 'warning'
}

const BadgeIcône: FunctionComponent<BadgeIcôneProps> = ({ type }) => {
  return (
    <BadgeIcôneStyled className={`fr-badge fr-badge--${type}`} />
  );
};

export default BadgeIcône;
