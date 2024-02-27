import BlocStyled from '@/components/_commons/Bloc/Bloc.styled';
import BlocProps from './Bloc.interface';

export default function Bloc({ children, contenuClassesSupplémentaires = 'fr-p-2w', titre }: BlocProps) {
  return (
    <BlocStyled>
      {
        !!titre &&
        <div className='titre fr-mb-0 fr-px-2w fr-p-1w fr-py-md-2w fr-text--sm fr-text--bold'>
          {titre}
        </div>
      }
      <div className={`${contenuClassesSupplémentaires} bloc__contenu`}>
        {children}
      </div>
    </BlocStyled>
  );
}
