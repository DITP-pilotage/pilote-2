import { FunctionComponent } from 'react';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';
import Titre from '@/components/_commons/Titre/Titre';
import TitreInfobulleConteneur from '@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur';

const TitreRubrique: FunctionComponent<{
  rubriqueNom: string
  rubriqueDescription: string | null
  nombreIndicateurRubrique: number
  rubriqueAncre: string

}> = ({ rubriqueNom, rubriqueDescription, nombreIndicateurRubrique, rubriqueAncre }) => {

  return (
    <TitreInfobulleConteneur>
      <Titre
        baliseHtml='h2'
        className='fr-text--lg fr-ml-md-0'
      >
        {`${rubriqueNom} (${nombreIndicateurRubrique})`}
      </Titre>
      {
        rubriqueDescription ? (
          <Infobulle 
            classNameBouton='fr-pb-2w' 
            idHtml={`infobulle-${rubriqueAncre}`}
          >
            {rubriqueDescription}
          </Infobulle>
        ) : null
      }
    </TitreInfobulleConteneur>
  );
};

export default TitreRubrique;
