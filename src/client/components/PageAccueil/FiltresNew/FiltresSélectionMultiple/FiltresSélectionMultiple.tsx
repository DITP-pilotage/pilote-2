import { parseAsString, useQueryState } from 'nuqs';
import { FunctionComponent } from 'react';
import { sauvegarderFiltres } from '@/stores/useFiltresStoreNew/useFiltresStoreNew';
import Axe from '@/server/domain/axe/Axe.interface';
import FiltresSélectionMultipleStyled from './FiltresSélectionMultiple.styled';

interface FiltresSélectionMultipleProps {
  catégorieDeFiltre: 'axes',
  filtres: Axe[],
  libellé: string,
}

const FiltresSélectionMultiple: FunctionComponent<FiltresSélectionMultipleProps> = ({
  catégorieDeFiltre,
  libellé,
  filtres,
}) => {

  const [filtresNew, setListeFiltresNew] = useQueryState(catégorieDeFiltre, parseAsString.withDefault('').withOptions({
    shallow: false,
    clearOnDefault: true,
    history: 'push',
  }));

  return (
    <FiltresSélectionMultipleStyled>
      <button
        aria-controls={`fr-sidemenu-item-${catégorieDeFiltre}`}
        aria-expanded='false'
        className='fr-sidemenu__btn fr-m-0'
        type='button'
      >
        {libellé}
      </button>
      <div
        className='fr-collapse'
        id={`fr-sidemenu-item-${catégorieDeFiltre}`}
      >
        <ul className='fr-p-0 fr-m-0 fr-mb-1w'>
          {filtres.map(filtre => (
            <li
              className='fr-p-0 fr-my-1w fr-mr-0'
              key={filtre.id}
            >
              <button
                className={`
                  fr-m-0 fr-p-1w fr-text--md tuile
                  ${filtresNew.includes(filtre.id) ? 'actif' : ''}
                `}
                onClick={() => {
                  let arrFiltresNew = filtresNew.split(',').filter(Boolean);
                  if (arrFiltresNew.includes(filtre.id)) {
                    arrFiltresNew.splice(filtresNew.indexOf(filtre.id), 1);
                  } else {
                    arrFiltresNew.push(filtre.id);
                  }
                  sauvegarderFiltres({ axes: arrFiltresNew });
                  return setListeFiltresNew(arrFiltresNew.join(','));
                }}
                type='button'
              >
                {filtre.nom}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </FiltresSélectionMultipleStyled>
  );
};

export default FiltresSélectionMultiple;
