import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { FunctionComponent } from 'react';
import { useSession } from 'next-auth/react';
import { sauvegarderFiltres } from '@/stores/useFiltresStoreNew/useFiltresStoreNew';
import api from '@/server/infrastructure/api/trpc/api';
import { statutArchive, statutBrouillon, statutBrouillonEtPublie, statutPublie } from '@/client/constants/statut';
import { FiltresSélectionUniqueStyled } from './FiltresSelectionUnique.styled';

const availableFiltres = ['statut'] as const;

interface FiltresSelectionUniqueProps {
  categorieDeFiltre: typeof availableFiltres[number],
  libelle: string,
}

export const FiltresSelectionUnique: FunctionComponent<FiltresSelectionUniqueProps> = ({
  categorieDeFiltre,
  libelle,
}) => {
  const { data: session } = useSession();

  const { data: variableContenuFFPpgArchive } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_FF_PPG_ARCHIVE' });
  const profilPeutAccederAuxBrouillons = !!session?.profilAAccèsAuxChantiersBrouillons;

  const valuesFiltres = {
    statut: {
      valeurDisponible: variableContenuFFPpgArchive && profilPeutAccederAuxBrouillons ? [statutPublie, statutBrouillon, statutBrouillonEtPublie, statutArchive] : [statutPublie, statutBrouillon, statutBrouillonEtPublie],
      valeurParDéfaut: 'PUBLIE',
    },
  };

  const [filtresNew, setListeFiltresNew] = useQueryState(categorieDeFiltre, parseAsString.withDefault(valuesFiltres[categorieDeFiltre].valeurParDéfaut).withOptions({
    shallow: false,
    clearOnDefault: true,
    history: 'push',
  }));

  const [, setPagination] = useQueryState('pageIndex', parseAsInteger.withDefault(1).withOptions({
    shallow: false,
  }));

  const auChangement = (valeur: string) => {
    sauvegarderFiltres({ [categorieDeFiltre]: valeur });
    setPagination(1);
    setListeFiltresNew(valeur);
  };

  return (
    <FiltresSélectionUniqueStyled>
      <button
        aria-controls={`fr-sidemenu-item-${categorieDeFiltre}`}
        aria-expanded='false'
        className='fr-sidemenu__btn fr-m-0 fr-text--sm fr-py-1w'
        type='button'
      >
        {libelle}
      </button>
      <div
        className='fr-collapse'
        id={`fr-sidemenu-item-${categorieDeFiltre}`}
      >
        <ul className='fr-p-0 fr-m-0 fr-mb-1w fr-pl-1w'>
          {valuesFiltres[categorieDeFiltre].valeurDisponible.map(filtre => (
            <li
              className='fr-p-0 fr-my-1w fr-mr-0'
              key={filtre.id}
            >
              <div className='fr-checkbox-group'>
                <button
                  className={`fr-tag fr-tag--icon-left fr-mr-1w ${filtresNew === filtre.id ? 'fr-tag-active' : ''}`}
                  id={`${categorieDeFiltre}-${filtre.id}`}
                  key={`${categorieDeFiltre}-${filtre.id}`}
                  onClick={() => filtresNew !== filtre.id && auChangement(filtre.id)}
                  type='button'
                >
                  {filtre.nom}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </FiltresSélectionUniqueStyled>
  );
};
