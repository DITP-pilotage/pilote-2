import '@gouvfr/dsfr/dist/component/sidemenu/sidemenu.min.css';
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs';
import { useCallback } from 'react';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Icône from '@/components/_commons/Icône/Icône';
import FiltresMinistèresProps from './FiltresMinistères.interface';
import FiltresMinistèresStyled from './FiltresMinistères.styled';

const catégorieDeFiltre: 'périmètresMinistériels' = 'périmètresMinistériels';

export default function FiltresMinistères({ ministères }: FiltresMinistèresProps) {
  const [perimetres, setPerimetres] = useQueryState('perimetres', parseAsArrayOf(parseAsString).withDefault([]).withOptions({
    shallow: false,
    clearOnDefault: true,
    history: 'push',
  }));

  const estDéroulé = useCallback((ministère: Ministère) => {
    return ministère.périmètresMinistériels.some(périmètre => perimetres.includes(périmètre.id));
  }, [perimetres]);

  const auClicSurUnMinistèreCallback = useCallback(
    (ministère: Ministère) => {
      if (estDéroulé(ministère)) {
        ministère.périmètresMinistériels.forEach(périmètre => perimetres.splice(perimetres.indexOf(périmètre.id), 1));
      } else {
        ministère.périmètresMinistériels.forEach(périmètre => perimetres.push(périmètre.id));
      }
      return setPerimetres(perimetres);
    },
    [estDéroulé, perimetres, setPerimetres],
  );

  const auClicSurUnPérimètreCallback = useCallback(
    (périmètre: PérimètreMinistériel) => {
      if (perimetres.includes(périmètre.id)) {
        perimetres.splice(perimetres.indexOf(périmètre.id), 1);
      } else {
        perimetres.push(périmètre.id);
      }
      return setPerimetres(perimetres);
    },
    [perimetres, setPerimetres],
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
                                ${perimetres.includes(périmètre.id) ? 'actif' : ''}
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
}
