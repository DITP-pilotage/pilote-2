import '@gouvfr/dsfr/dist/component/accordion/accordion.min.css';
import { consignesDÉcritureObjectif, libellésTypesObjectif, TypeObjectif } from '@/client/constants/libellésObjectif';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Publication from '@/components/_commons/PublicationNew/Publication';
import { ObjectifsProps } from './Objectifs.interface';

export default function Objectifs({
  objectifs,
  réformeId,
  maille,
  nomTerritoire,
  typesObjectif,
  estEtendu = true,
  modeÉcriture = false,
  estInteractif = true,
  territoireCode,
}: ObjectifsProps) {
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
                aria-expanded={estEtendu}
                className='fr-accordion__btn'
                title={libellésTypesObjectif[type as TypeObjectif]}
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
                territoireCode={territoireCode}
              />
            </div>
          </section>

        ))
      }
    </Bloc>
  );
}
