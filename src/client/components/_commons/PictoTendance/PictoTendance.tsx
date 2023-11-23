import PictoTendanceStyled from '@/components/_commons/PictoTendance/PictoTendance.styled';
import PictoTendanceProps from '@/components/_commons/PictoTendance/PictoTendance.interface';

export default function PictoTendance({ tendance }: PictoTendanceProps) {
  if (tendance === null) {
    return (
      <span aria-hidden='true' />
    );
  }
  return (
    tendance === 'STAGNATION' ? (
      <PictoTendanceStyled
        aria-hidden='true'
        className='fr-icon-subtract-line picto-tendance--stagnation'
      />
    ) : (
      <PictoTendanceStyled
        aria-hidden='true'
        className={`fr-icon-arrow-right-up-line ${tendance === 'BAISSE' ? 'picto-tendance--baisse' : 'picto-tendance--hausse'}`}
      />
    )
  );
}
