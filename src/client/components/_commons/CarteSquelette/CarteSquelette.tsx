import CarteSqueletteProps from './CarteSquelette.interface';
import CarteSqueletteStyled from './CarteSquelette.styled';

export default function CarteSquelette({ children }: CarteSqueletteProps) {
  return (
    <CarteSqueletteStyled className='fr-px-3w fr-py-2w'>
      {children}
    </CarteSqueletteStyled>
  );
}
