import '@gouvfr/dsfr/dist/component/sidemenu/sidemenu.min.css';
import { useCallback } from 'react';
import { actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import FiltresMinistèresProps from './FiltresMinistères.interface';
import FiltresMinistèresStyled from './FiltresMinistères.styled';

export default function FiltresMinistères({ libellé, catégorieDeFiltre, ministères }: FiltresMinistèresProps) {
  const { activerUnFiltre, désactiverUnFiltre, estActif } = actionsFiltresStore();

  const estDéroulé = useCallback((ministère: Ministère) => {
    return ministère.périmètresMinistériels.some(périmètre => estActif(périmètre.id, catégorieDeFiltre));
  }, [catégorieDeFiltre, estActif]);

  const auClicSurUnMinistèreCallback = useCallback(
    (ministère: Ministère) => {
      if (estDéroulé(ministère)) {
        ministère.périmètresMinistériels.forEach(périmètre => désactiverUnFiltre(périmètre.id, catégorieDeFiltre));
      } else {
        ministère.périmètresMinistériels.forEach(périmètre => activerUnFiltre(périmètre, catégorieDeFiltre));
      }
    },
    [activerUnFiltre, catégorieDeFiltre, désactiverUnFiltre, estDéroulé],
  );

  const auClicSurUnPérimètreCallback = useCallback(
    (périmètre: PérimètreMinistériel) => {
      if (estActif(périmètre.id, catégorieDeFiltre)) {
        désactiverUnFiltre(périmètre.id, catégorieDeFiltre);
      } else {
        activerUnFiltre(périmètre, catégorieDeFiltre);
      }
    },
    [activerUnFiltre, catégorieDeFiltre, désactiverUnFiltre, estActif],
  );

  return (
    <FiltresMinistèresStyled className="fr-form-group">
      <button
        aria-controls={`fr-sidemenu-item-${catégorieDeFiltre}`}
        aria-expanded="true"
        className="fr-sidemenu__btn fr-m-0"
        type='button'
      >
        { libellé }
      </button>
      <div
        className="fr-collapse"
        id={`fr-sidemenu-item-${catégorieDeFiltre}`}
      >
        <ul
          aria-label={`Liste des filtres ${libellé}`}
          className='fr-p-0 fr-m-0 ministères-liste'
        >
          {
            ministères.map((ministère) => {
              return (
                <li
                  className="fr-checkbox-group"
                  key={ministère.nom}
                >
                  <button
                    className={`
                        fr-m-0 fr-p-1w fr-text--md tuile
                        ${estDéroulé(ministère) ? 'ministère-déroulé actif' : ''}
                      `}
                    onClick={() => auClicSurUnMinistèreCallback(ministère)}
                    type="button"
                  >
                    {ministère.nom}
                  </button>
                  <ul className="fr-p-0 fr-m-0 fr-mb-1w périmètres-liste">
                    {
                      ministère.périmètresMinistériels.map(périmètre => (
                        <li
                          className="fr-p-0 fr-my-1w fr-mr-0 fr-ml-4w"
                          key={périmètre.id}
                        >
                          <button
                            className={`
                              fr-m-0 fr-p-1w fr-text--md tuile
                              ${estActif(périmètre.id, catégorieDeFiltre) ? 'actif' : ''}
                            `}
                            onClick={() => auClicSurUnPérimètreCallback(périmètre)}
                            type="button"
                          >
                            {périmètre.nom}
                          </button>
                        </li>
                      ))
                    }
                  </ul>
                </li>
              );
            })
          }
        </ul>
      </div>
    </FiltresMinistèresStyled>
  );
}
