import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { FunctionComponent } from 'react';
import { useSession } from 'next-auth/react';
import { sauvegarderFiltres } from '@/stores/useFiltresStoreNew/useFiltresStoreNew';
import api from '@/server/infrastructure/api/trpc/api';
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
      valeurDisponible: [
        { valeur: 'PUBLIE', libelle: 'Chantiers validés (par défaut)' },
        { valeur: 'BROUILLON', libelle: 'Chantiers en cours de publication' },
        { valeur: 'BROUILLON_ET_PUBLIE', libelle: 'Tous les chantiers suivis' },
        variableContenuFFPpgArchive && profilPeutAccederAuxBrouillons ? { valeur: 'ARCHIVE', libelle: 'Chantiers précédemment suivis' } : null,
      ].filter(Boolean),
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
              key={filtre.valeur}
            >
              <div className='fr-checkbox-group'>
                <button
                  className={`fr-tag fr-tag--icon-left fr-mr-1w ${filtresNew === filtre.valeur ? 'fr-tag-active' : ''}`}
                  id={`${categorieDeFiltre}-${filtre.valeur}`}
                  key={`${categorieDeFiltre}-${filtre.valeur}`}
                  onClick={() => filtresNew !== filtre.valeur && auChangement(filtre.valeur)}
                  type='button'
                >
                  {filtre.libelle}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </FiltresSélectionUniqueStyled>
  );
};
