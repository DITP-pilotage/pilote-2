import CompteurCaractèresProps from './CompteurCaractères.interface';
import CompteurCaractèresStyled from './CompteurCaractères.styled';

export default function CompteurCaractères({ compte, limiteDeCaractères }: CompteurCaractèresProps) {
  return (
    <CompteurCaractèresStyled className='fr-text--xs fr-mb-0'>
      <span>
        {compte}
        /
        {limiteDeCaractères}
      </span>
    </CompteurCaractèresStyled>
  );
}
