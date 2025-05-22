import { parseAsBoolean, parseAsInteger, ParserBuilder, useQueryState, useQueryStates } from 'nuqs';
import { FunctionComponent } from 'react';
import { sauvegarderFiltres } from '@/stores/useFiltresStoreNew/useFiltresStoreNew';
import { FiltresSélectionMultipleStyled } from './FiltresSelectionMultipleBoolean.styled';

const availableFiltres = ['estBarometre', 'estTerritorialise'] as const;

const valuesFiltres: Record<typeof availableFiltres[number], string> = {
  estBarometre: 'Chantiers du baromètre',
  estTerritorialise: 'Chantiers territorialisés',
};

interface FiltresSelectionMultipleBooleanProps {
  listeCategorieDeFiltre: Array<typeof availableFiltres[number]>,
  libelle: string,
}

export const FiltresSelectionMultipleBoolean: FunctionComponent<FiltresSelectionMultipleBooleanProps> = ({
  listeCategorieDeFiltre,
  libelle,
}) => {

  const listesFiltres: Record<typeof availableFiltres[number], ParserBuilder<boolean>> = listeCategorieDeFiltre.reduce((acc, catégorieDeFiltre) => {
    acc[catégorieDeFiltre] = parseAsBoolean.withDefault(false).withOptions({
      shallow: false,
      clearOnDefault: true,
      history: 'push',
    });
    return acc;
  }, {} as Record<typeof availableFiltres[number], ParserBuilder<boolean>>);

  const [filtresNew, setListeFiltresNew] = useQueryStates(listesFiltres, {
    shallow: false,
    clearOnDefault: true,
    history: 'push',
  });

  const [, setPagination] = useQueryState('pageIndex', parseAsInteger.withDefault(1).withOptions({
    shallow: false,
  }));

  return (
    <FiltresSélectionMultipleStyled>
      <button
        aria-controls={`fr-sidemenu-item-${listeCategorieDeFiltre.join('-')}`}
        aria-expanded='false'
        className='fr-sidemenu__btn fr-m-0 fr-text--sm'
        type='button'
      >
        {libelle}
      </button>
      <div
        className='fr-collapse'
        id={`fr-sidemenu-item-${listeCategorieDeFiltre.join('-')}`}
      >
        <ul className='fr-p-0 fr-m-0 fr-mb-1w fr-pl-1w'>
          {listeCategorieDeFiltre.map(filtre => (
            <li
              className='fr-p-0 fr-my-1w fr-mr-0'
              key={filtre}
            >
              <div className='fr-checkbox-group fr-pb-1w'>
                <input
                  checked={filtresNew[filtre] ?? false}
                  className='fr-input'
                  id={filtre}
                  onChange={() => {
                    sauvegarderFiltres({ [filtre]: !filtresNew[filtre] });
                    setPagination(1);
                    return setListeFiltresNew({ ...filtresNew, [filtre]: !filtresNew[filtre] });
                  }}
                  type='checkbox'
                />
                <label
                  className='fr-label'
                  htmlFor={filtre}
                >
                  {valuesFiltres[filtre]}
                </label>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </FiltresSélectionMultipleStyled>
  );
};
