import { useCallback } from 'react';
import { actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';
import { Filtre } from '@/stores/useFiltresStore/useFiltresStore.interface';
import FiltresTuilesActivablesProps from './FiltresTuilesActivables.interface';
import FiltresTuilesActivablesStyled from './FiltresTuilesActivables.styled';

export default function FiltresTuilesActivables({
  catégorieDeFiltre,
  libellé,
  filtres,
}: FiltresTuilesActivablesProps) {
  const { activerUnFiltre, désactiverUnFiltre, estActif } = actionsFiltresStore();

  const auClicSurUnFiltreCallback = useCallback(
    (filtre: Filtre) => {
      if (estActif(filtre.id, catégorieDeFiltre)) {
        désactiverUnFiltre(filtre.id, catégorieDeFiltre);
      } else {
        activerUnFiltre(filtre, catégorieDeFiltre);
      }
    },
    [activerUnFiltre, catégorieDeFiltre, désactiverUnFiltre, estActif],
  );

  return (
    <FiltresTuilesActivablesStyled>
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
    </FiltresTuilesActivablesStyled>
  );
}
