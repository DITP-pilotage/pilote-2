import '@gouvfr/dsfr/dist/component/sidemenu/sidemenu.min.css';
import { FunctionComponent, useCallback } from 'react';
import { actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import { FiltreCatégorie } from '@/client/stores/useFiltresStore/useFiltresStore.interface';
import Icône from '@/components/_commons/Icône/Icône';
import FiltresMinistèresStyled from './FiltresMinistères.styled';

interface FiltresMinistèresProps {
  ministères: Ministère[]
}

const catégorieDeFiltre: FiltreCatégorie = 'périmètresMinistériels';

const FiltresMinistères: FunctionComponent<FiltresMinistèresProps> = ({ ministères }) => {
  const { activerUnFiltre, désactiverUnFiltre, estActif } = actionsFiltresStore();

  const estDéroulé = useCallback((ministère: Ministère) => {
    return ministère.périmètresMinistériels.some(périmètre => estActif(périmètre.id, catégorieDeFiltre));
  }, [estActif]);

  const auClicSurUnMinistèreCallback = useCallback(
    (ministère: Ministère) => {
      if (estDéroulé(ministère)) {
        ministère.périmètresMinistériels.forEach(périmètre => désactiverUnFiltre(périmètre.id, catégorieDeFiltre));
      } else {
        ministère.périmètresMinistériels.forEach(périmètre => activerUnFiltre(périmètre, catégorieDeFiltre));
      }
    },
    [activerUnFiltre, désactiverUnFiltre, estDéroulé],
  );

  const auClicSurUnPérimètreCallback = useCallback(
    (périmètre: PérimètreMinistériel) => {
      if (estActif(périmètre.id, catégorieDeFiltre)) {
        désactiverUnFiltre(périmètre.id, catégorieDeFiltre);
      } else {
        activerUnFiltre(périmètre, catégorieDeFiltre);
      }
    },
    [activerUnFiltre, désactiverUnFiltre, estActif],
  );

  return (
    <FiltresMinistèresStyled className='fr-form-group'>
      <button
        aria-controls={`fr-sidemenu-item-${catégorieDeFiltre}`}
        aria-expanded='true'
        className='fr-sidemenu__btn fr-m-0'
        type='button'
      >
        Ministères
      </button>
      <div
        className='fr-collapse'
        id={`fr-sidemenu-item-${catégorieDeFiltre}`}
      >
        <ul
          aria-label='Liste des filtres ministères'
          className='fr-p-0 fr-m-0 ministères-liste'
        >
          {
            ministères.map((ministère) => {
              return (
                <li
                  className=''
                  key={ministère.nom}
                >
                  <button
                    className={`
                        fr-m-0 fr-p-1w fr-text--md tuile
                        ${estDéroulé(ministère) ? 'ministère-déroulé actif' : ''}
                      `}
                    onClick={() => auClicSurUnMinistèreCallback(ministère)}
                    type='button'
                  >
                    <div className='tuile-ministère-contenu'>
                      <span className='icône'>
                        {
                          !!ministère.icône &&
                          <Icône id={ministère.icône} />
                        }
                      </span>
                      <span>
                        {ministère.nom}
                      </span>
                    </div>
                  </button>
                  {
                    ministère.périmètresMinistériels.length > 1 &&
                    <ul
                      className='fr-p-0 fr-m-0 fr-mb-1w périmètres-liste'
                      tabIndex={!estDéroulé(ministère) ? -1 : undefined}
                    >
                      {
                        ministère.périmètresMinistériels.map(périmètre => (
                          <li
                            className='fr-p-0 fr-my-1w fr-mr-0 fr-ml-4w'
                            key={périmètre.id}
                          >
                            <button
                              className={`
                                fr-m-0 fr-p-1w fr-text--md tuile
                                ${estActif(périmètre.id, catégorieDeFiltre) ? 'actif' : ''}
                              `}
                              onClick={() => auClicSurUnPérimètreCallback(périmètre)}
                              tabIndex={!estDéroulé(ministère) ? -1 : undefined}
                              type='button'
                            >
                              {périmètre.nom}
                            </button>
                          </li>
                        ))
                      }
                    </ul>
                  }
                </li>
              );
            })
          }
        </ul>
      </div>
    </FiltresMinistèresStyled>
  );
};

export default FiltresMinistères;
