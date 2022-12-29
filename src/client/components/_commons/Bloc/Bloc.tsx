import BlocStyled from '@/components/_commons/Bloc/Bloc.styled';
import BlocProps from './Bloc.interface';

export default function Bloc({ children }: BlocProps) {
  return (
    <BlocStyled className='fr-px-3w fr-py-2w'>
      {children}
    </BlocStyled>
  );
}
