import { useCallback } from 'react';
import { actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';
import { Filtre } from '@/stores/useFiltresStore/useFiltresStore.interface';
import FiltresSélectionMultipleProps from './FiltresSélectionMultiple.interface';
import FiltresSélectionMultipleStyled from './FiltresSélectionMultiple.styled';

export default function FiltresSélectionMultiple({
  catégorieDeFiltre,
  libellé,
  filtres,
}: FiltresSélectionMultipleProps) {
  const { changerÉtatDuFiltre, estActif } = actionsFiltresStore();

  const auClicSurUnFiltreCallback = useCallback(
    (filtre: Filtre) => {
      changerÉtatDuFiltre(filtre, catégorieDeFiltre);
    },
    [ catégorieDeFiltre, changerÉtatDuFiltre],
  );

  return (
    <FiltresSélectionMultipleStyled>
      <button
        aria-controls={`fr-sidemenu-item-${catégorieDeFiltre}`}
        aria-expanded="false"
        className="fr-sidemenu__btn fr-m-0"
        type='button'
      >
        {libellé}
      </button>
      <div
        className="fr-collapse"
        id={`fr-sidemenu-item-${catégorieDeFiltre}`}
      >
        <ul className="fr-p-0 fr-m-0 fr-mb-1w">
          {filtres.map(filtre => (
            <li
              className="fr-p-0 fr-my-1w fr-mr-0"
              key={filtre.id}
            >
              <button
                className={`
                  fr-m-0 fr-p-1w fr-text--md tuile
                  ${estActif(filtre.id, catégorieDeFiltre) ? 'actif' : ''}
                `}
                onClick={() => auClicSurUnFiltreCallback(filtre)}
                type="button"
              >
                {filtre.nom}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </FiltresSélectionMultipleStyled>
  );
}
