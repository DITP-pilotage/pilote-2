import '@gouvfr/dsfr/dist/component/accordion/accordion.min.css';
import { FunctionComponent } from 'react';
import { consignesDÉcritureObjectif, libellésTypesObjectif, TypeObjectif } from '@/client/constants/libellésObjectif';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Publication from '@/components/_commons/PublicationNew/Publication';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import Objectif, { typesObjectif } from '@/server/domain/chantier/objectif/Objectif.interface';
import ObjectifProjetStructurant, {
  TypeObjectifProjetStructurant,
} from '@/server/domain/projetStructurant/objectif/Objectif.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';

export interface ObjectifsProps {
  objectifs: (Objectif | ObjectifProjetStructurant)[] | null
  réformeId: Chantier['id'] | ProjetStructurant['id']
  maille: Maille
  nomTerritoire: string
  tousLesTypesDObjectif: typeof typesObjectif | TypeObjectifProjetStructurant[]
  estEtendu: boolean
  modeÉcriture?: boolean
  estInteractif?: boolean
  territoireCode: string
}

const Objectifs: FunctionComponent<ObjectifsProps> = ({
  objectifs,
  réformeId,
  maille,
  nomTerritoire,
  tousLesTypesDObjectif,
  estEtendu = true,
  modeÉcriture = false,
  estInteractif = true,
  territoireCode,
}) => {
  return (
    <Bloc
      contenuClassesSupplémentaires=''
      titre={nomTerritoire}
    >
      {
        tousLesTypesDObjectif.map((type) => (
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
};

export default Objectifs;
