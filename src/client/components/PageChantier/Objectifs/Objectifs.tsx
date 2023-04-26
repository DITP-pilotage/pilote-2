import { Fragment } from 'react';
import libellésTypesObjectif from '@/client/constants/libellésTypesObjectif';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import { ObjectifProps } from '@/components/PageChantier/Objectifs/Objectifs.interface';
import Publication from '@/components/_commons/Publication/Publication';
import { TypeObjectif } from '@/server/domain/objectif/Objectif.interface';

export default function Objectifs({ objectifs, chantierId, maille, codeInsee, modeÉcriture = false, estInteractif = true }: ObjectifProps) {
  return (
    <section id="objectifs">
      <Titre
        baliseHtml='h2'
        className='fr-h4 fr-mb-2w'
      >
        Objectifs
      </Titre>
      <Bloc titre="France">
        {
          !!objectifs &&
            objectifs.map(({ publication, type }, i) => (
              <Fragment key={type}>
                {
                  i !== 0 && (
                    <hr className="fr-hr fr-mx-n2w" />
                  )
                }
                <Publication
                  chantierId={chantierId}
                  codeInsee={codeInsee}
                  entité="objectifs"
                  estInteractif={estInteractif}
                  maille={maille}
                  modeÉcriture={modeÉcriture}
                  publicationInitiale={publication}
                  type={{ id: type, libellé: libellésTypesObjectif[type as TypeObjectif] }}
                />
              </Fragment>
            ))
        }
      </Bloc>
    </section>
  );
}
