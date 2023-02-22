import BlocStyled from '@/components/_commons/Bloc/Bloc.styled';
import BlocProps from './Bloc.interface';

export default function Bloc({ children, titre }: BlocProps) {
  return (
    <BlocStyled>
      {
        !!titre &&
        <div className='titre fr-mb-0 fr-p-2w fr-text--sm fr-text--bold'>
          {titre}
        </div>
      }
      <div className='fr-p-2w'>
        {children}
      </div>
    </BlocStyled>
  );
}
