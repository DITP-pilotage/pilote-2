import '@gouvfr/dsfr/dist/component/badge/badge.min.css';
import BadgeIcôneProps from '@/components/_commons/BadgeIcône/BadgeIcône.interface';
import BadgeIcôneStyled from '@/components/_commons/BadgeIcône/BadgeIcône.styled';

export default function BadgeIcône({ type }: BadgeIcôneProps) {
  return (
    <BadgeIcôneStyled className={`fr-badge fr-badge--${type} fr-badge`} />
  );
}
