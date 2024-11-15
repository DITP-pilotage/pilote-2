import { FunctionComponent } from 'react';
import BlocStyled from '@/components/_commons/Bloc/Bloc.styled';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';

interface BlocProps {
  children: React.ReactNode
  contenuClassesSupplémentaires?: string
  className?: string
  titre?: string
  contenuInfobulle?: React.ReactNode
}

const Bloc: FunctionComponent<BlocProps> = ({
  children,
  contenuClassesSupplémentaires = 'fr-p-2w',
  titre,
  contenuInfobulle,
  className = '',
}) => {
  return (
    <BlocStyled className={`bloc-container${className ? ` ${className}` : ''}`}>
      {
        titre ? (
          <div className='titre fr-mb-0 fr-pl-2w fr-p-1w fr-py-md-2w fr-text--sm fr-text--bold flex'>
            {titre}
            {
              titre && contenuInfobulle ? (
                <Infobulle
                  className='fr-pt-0'
                  idHtml='infobulle-chantiers-jauges'
                >
                  {contenuInfobulle}
                </Infobulle>
              ) : null
            }
          </div>
        ) : null
      }
      <div className={`bloc__contenu${contenuClassesSupplémentaires ? ` ${contenuClassesSupplémentaires}` : ''}`}>
        {children}
      </div>
    </BlocStyled>
  );
};

export default Bloc;
