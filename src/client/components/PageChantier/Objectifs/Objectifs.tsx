import { Fragment } from 'react';
import { consignesDÉcritureObjectif, libellésTypesObjectif } from '@/client/constants/libellésObjectif';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import { ObjectifProps } from '@/components/PageChantier/Objectifs/Objectifs.interface';
import Publication from '@/components/_commons/Publication/Publication';
import { TypeObjectif, typesObjectif } from '@/server/domain/objectif/Objectif.interface';

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
          typesObjectif.map((type, i ) => (
            <Fragment key={type}>
              {
                  i !== 0 && (
                    <hr className="fr-hr fr-mx-n2w" />
                  )
                }
              <Publication
                caractéristiques={{
                  type: type,
                  entité: 'objectifs',
                  libelléType: libellésTypesObjectif[type as TypeObjectif],
                  consigneDÉcriture: consignesDÉcritureObjectif[type as TypeObjectif],
                }}
                chantierId={chantierId}
                codeInsee={codeInsee}
                estInteractif={estInteractif}
                maille={maille}
                modeÉcriture={modeÉcriture}
                publicationInitiale={objectifs?.find(objectif => objectif?.type === type) || null}
              />
            </Fragment>
          ))
        }
      </Bloc>
    </section>
  );
}
