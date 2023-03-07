import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import { formaterDate } from '@/client/utils/date/date';
import { ObjectifProps } from '@/components/PageChantier/Objectif/Objectif.interface';

export default function Objectif({ objectif }: ObjectifProps) {
  return (
    <div id="objectifs">
      <Titre
        baliseHtml='h2'
        className='fr-h4 fr-mb-2w'
      >
        Objectifs
      </Titre>
      <Bloc titre="National">
        <div className='fr-grid-row'>
          <div className="fr-col-12">
            {
              objectif && objectif?.contenu?.trim() !== ''
                ?
                  <>
                    <div className="texte-gris fr-text--xs fr-mb-1w">
                      {`Mis à jour le ${formaterDate(objectif.date, 'jj/mm/aaaa')}`}
                    </div>
                    <p className="fr-text--sm">
                      {objectif.contenu}
                    </p>
                  </>
                : 'Aucun objectif renseigné.'
            }
          </div>
        </div>
      </Bloc>
    </div>
  );
}
