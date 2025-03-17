import { FunctionComponent } from 'react';
import PictoTendanceStyled from '@/components/_commons/PictoTendance/PictoTendance.styled';
import { ChantierTendance } from '@/server/domain/chantier/Chantier.interface';

type Tendance = ChantierTendance;

interface PictoTendanceProps {
  tendance: Tendance | null;
  estArchive?: boolean
}

const PictoTendance: FunctionComponent<PictoTendanceProps> = ({ tendance, estArchive }) => {
  if (tendance === null) {
    return (
      <span aria-hidden='true' />
    );
  }
  return (
    tendance === 'STAGNATION' ? (
      <PictoTendanceStyled
        aria-hidden='true'
        className='fr-icon-arrow-right-line picto-tendance--stagnation'
        estArchive={estArchive}
      />
    ) : (
      <PictoTendanceStyled
        aria-hidden='true'
        className={`fr-icon-arrow-right-up-line ${tendance === 'BAISSE' ? 'picto-tendance--baisse' : 'picto-tendance--hausse'}`}
        estArchive={estArchive}
      />
    )
  );
};

export default PictoTendance;
