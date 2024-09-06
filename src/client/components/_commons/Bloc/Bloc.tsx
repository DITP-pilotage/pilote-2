import { FunctionComponent } from 'react';
import BlocStyled from '@/components/_commons/Bloc/Bloc.styled';

interface BlocProps {
  children: React.ReactNode
  contenuClassesSupplémentaires?: string
  titre?: string
}

const Bloc: FunctionComponent<BlocProps> = ({ children, contenuClassesSupplémentaires = 'fr-p-2w', titre }) => {
  return (
    <BlocStyled className='bloc-container'>
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
};

export default Bloc;
