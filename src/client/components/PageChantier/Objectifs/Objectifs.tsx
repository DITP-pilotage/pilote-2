import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import { ObjectifProps } from '@/components/PageChantier/Objectifs/Objectifs.interface';
import Publication from '@/components/PageChantier/Publication/Publication';

export default function Objectifs({ objectifs }: ObjectifProps) {
  return (
    <section id="objectifs">
      <Titre
        baliseHtml='h2'
        className='fr-h4 fr-mb-2w'
      >
        Objectifs
      </Titre>
      <Bloc titre="National">
        <div className='fr-grid-row'>
          <div className="fr-col-12">
            <Titre
              baliseHtml="h3"
              className="fr-h5 fr-mb-1w"
            >
              Notre ambition
            </Titre>
            <Publication
              auteur={objectifs.notreAmbition?.auteur ?? null}
              contenu={objectifs.notreAmbition?.contenu ?? null}
              date={objectifs.notreAmbition?.date ?? null}
              messageSiAucunContenu='Aucun objectif renseigné.'
            />
          </div>
        </div>
      </Bloc>
    </section>
  );
}
