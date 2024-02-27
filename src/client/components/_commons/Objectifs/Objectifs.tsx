import { consignesDÉcritureObjectif, libellésTypesObjectif, TypeObjectif } from '@/client/constants/libellésObjectif';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Publication from '@/components/_commons/Publication/Publication';
import { ObjectifsProps } from './Objectifs.interface';

export default function Objectifs({ objectifs, réformeId, maille, nomTerritoire, typesObjectif, modeÉcriture = false, estInteractif = true }: ObjectifsProps) {
  return (
    <Bloc 
      contenuClassesSupplémentaires=''
      titre={nomTerritoire} 
    >
      {
          typesObjectif.map((type) => (
            <section 
              className='fr-accordion' 
              key={type}
            >
              <h3 className='fr-accordion__title'>
                <button 
                  aria-controls={`accordion-${type}`}
                  aria-expanded='false'
                  className='fr-accordion__btn'
                  type='button'
                >
                  {libellésTypesObjectif[type as TypeObjectif]}
                </button>
              </h3>
              <div
                className='fr-collapse' 
                id={`accordion-${type}`}
              >
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
              </div>
            </section>

          ))
        }
    </Bloc>
  );
}
