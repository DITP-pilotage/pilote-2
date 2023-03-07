import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import { ObjectifsProps } from '@/components/PageChantier/Objectifs/Objectifs.interface';
import ObjectifsStyled from '@/components/PageChantier/Objectifs/Objectifs.styled';
import { formaterDate } from '@/client/utils/date/date';

export default function Objectifs({ objectif }: ObjectifsProps) {
  return (
    <div id="objectifs">
      <Titre
        baliseHtml='h2'
        className='fr-h4 fr-mb-2w'
      >
        Objectifs
      </Titre>
      <Bloc titre="National">
        <ObjectifsStyled className='fr-grid-row'>
          <div className="fr-col-12">
            {
              objectif && objectif?.contenu?.trim() !== ''
                ?
                  <>
                    <div className="metadonnées fr-text--xs fr-mb-1w">
                      {`Mis à jour le ${formaterDate(objectif.date, 'jj/mm/aaaa')}`}
                    </div>
                    <p className="fr-text--sm">
                      {objectif.contenu}
                    </p>
                  </>
                : 'Aucun objectif renseigné.'
            }
          </div>
        </ObjectifsStyled>
      </Bloc>
    </div>
  );
}
