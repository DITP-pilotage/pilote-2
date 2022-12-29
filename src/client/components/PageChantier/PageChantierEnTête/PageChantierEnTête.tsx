import Titre from '@/components/_commons/Titre/Titre';
import FilAriane from '@/components/_commons/FilAriane/FilAriane';
import PageChantierEnTêteProps from './PageChantierEnTête.interface';
import PageChantierEnTêteStyled from './PageChantierEnTête.styled';

export default function PageChantierEnTête({ chantier }: PageChantierEnTêteProps) {

  return (
    <PageChantierEnTêteStyled className='fr-px-md-15w fr-p-1w fr-pb-8w'>
      <FilAriane libelléPageCourante={chantier.nom} />
      <div className='fr-grid-row'>
        <div className='fr-col-12 fr-col-xl-7 fr-pr-10w'>
          <Titre baliseHtml='h1'>
            {chantier.nom}
          </Titre>
        </div>
        <div className='fr-col-12 fr-col-xl-5'>
          <p className='donnéesChantier fr-mb-1w fr-text--xs'>
            <strong>
              Axe :
            </strong>
            {' '}
            Non renseigné
          </p>
          <p className='donnéesChantier fr-mb-1w fr-text--xs'>
            <strong>
              Politique Prioritaire du Gouvernement :
            </strong>
            {' '}
            Non renseigné
          </p>
        </div>
      </div>
    </PageChantierEnTêteStyled>
  );
}
