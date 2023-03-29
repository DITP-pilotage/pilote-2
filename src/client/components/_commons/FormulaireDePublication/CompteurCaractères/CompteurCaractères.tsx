import CompteurCaractèresProps from './CompteurCaractères.interface';
import CompteurCaractèresStyled from './CompteurCaractères.styled';

export default function CompteurCaractères({ compte,  limiteDeCaractères }: CompteurCaractèresProps) {
  return (
    <CompteurCaractèresStyled className='fr-text--xs'>
      <span>
        {compte}
      </span>
      <span>
        /
        {limiteDeCaractères}
      </span>
    </CompteurCaractèresStyled>
  );
}
