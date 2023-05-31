import { Fragment } from 'react';
import { consignesDÉcritureObjectif, libellésTypesObjectif } from '@/client/constants/libellésObjectif';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Publication from '@/components/_commons/Publication/Publication';
import { ObjectifsProps, TypeObjectif } from './Objectifs.interface';

export default function Objectifs({ objectifs, réformeId, maille, nomTerritoire, typesObjectif, modeÉcriture = false, estInteractif = true }: ObjectifsProps) {
  return (
    <Bloc titre={nomTerritoire}>
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
                estInteractif={estInteractif}
                maille={maille}
                modeÉcriture={modeÉcriture}
                publicationInitiale={objectifs?.find(objectif => objectif?.type === type) || null}
                réformeId={réformeId}
              />
            </Fragment>
          ))
        }
    </Bloc>
  );
}
