import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import { ObjectifProps } from '@/components/PageChantier/Objectif/Objectif.interface';
import Publication from '@/components/PageChantier/Publication/Publication';

export default function Objectif({ objectif }: ObjectifProps) {
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
            <Publication
              auteur={objectif?.auteur ?? null}
              contenu={objectif?.contenu ?? null}
              date={objectif?.date ?? null}
              messageSiAucunContenu='Aucun objectif renseigné.'
            />
          </div>
        </div>
      </Bloc>
    </section>
  );
}
