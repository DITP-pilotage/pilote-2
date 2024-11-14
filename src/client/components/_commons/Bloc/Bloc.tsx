import { FunctionComponent } from 'react';
import BlocStyled from '@/components/_commons/Bloc/Bloc.styled';

interface BlocProps {
  children: React.ReactNode
  contenuClassesSupplémentaires?: string
  className?: string
  titre?: string
}

const Bloc: FunctionComponent<BlocProps> = ({
  children,
  contenuClassesSupplémentaires = 'fr-p-2w',
  titre,
  className = '',
}) => {
  return (
    <BlocStyled className={`bloc-container${className ? ` ${className}` : ''}`}>
      {
        !!titre &&
        <div className='titre fr-mb-0 fr-px-2w fr-p-1w fr-py-md-2w fr-text--sm fr-text--bold'>
          {titre}
        </div>
      }
      <div className={`bloc__contenu${contenuClassesSupplémentaires ? ` ${contenuClassesSupplémentaires}` : ''}`}>
        {children}
      </div>
    </BlocStyled>
  );
};

export default Bloc;
