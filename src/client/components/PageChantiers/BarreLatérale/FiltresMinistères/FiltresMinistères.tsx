import '@gouvfr/dsfr/dist/component/checkbox/checkbox.min.css';
import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/component/sidemenu/sidemenu.min.css';
import { Fragment, useCallback } from 'react';
import { actions as actionsFiltresStore, filtresActifs as filtresActifsStore } from '@/stores/useFiltresStore/useFiltresStore';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import FiltresMinistèresProps from './FiltresMinistères.interface';
import FiltresMinistèresStyled from './FiltresMinistères.styled';

export default function FiltresMinistères({ libellé, catégorieDeFiltre, ministères }: FiltresMinistèresProps) {
  const { activerUnFiltre, désactiverUnFiltre, estActif } = actionsFiltresStore();
  const filtresActifs = filtresActifsStore();

  const changementDeLÉtatDuFiltreCallback = useCallback((estSélectionné: boolean, filtre: PérimètreMinistériel) => {
    return estSélectionné ? activerUnFiltre(filtre, catégorieDeFiltre) : désactiverUnFiltre(filtre.id, catégorieDeFiltre);
  }, [activerUnFiltre, désactiverUnFiltre, catégorieDeFiltre]);

  const nombreFiltresActifCatégorie = actionsFiltresStore().récupérerNombreFiltresActifsDUneCatégorie(catégorieDeFiltre);

  return (
    <FiltresMinistèresStyled className="fr-form-group">
      <button
        aria-controls={`fr-sidemenu-item-${catégorieDeFiltre}`}
        aria-expanded="false"
        className="fr-sidemenu__btn"
        type='button'
      >
        {libellé}
        { ' ' }
        { nombreFiltresActifCatégorie > 0 && `(${nombreFiltresActifCatégorie})` }
      </button>
      <div
        className="fr-collapse"
        id={`fr-sidemenu-item-${catégorieDeFiltre}`}
      >
        <ul
          aria-label={`Liste des filtres ${catégorieDeFiltre}`}
          className='choix-filtres'
        >
          {
            ministères.map((ministère) => {
              return (
                <Fragment key={ministère.id}>
                  <li className="fr-checkbox-group">
                    <div
                      aria-expanded="false"
                      className={`fr-p-1w libellé ${
                        filtresActifs.périmètresMinistériels
                          .some(périmètreMinistérielActif => ministère.périmètresMinistériels
                            .some(périmètreMinistériel => périmètreMinistériel.id === périmètreMinistérielActif.id))
                        && 'ministère-sélectionné'
                      }`}
                    >
                      {ministère.nom}
                    </div>
                    <ul className="fitres-liste">
                      {
                        ministère.périmètresMinistériels.map(périmètreMinistériel => (
                          <li
                            className="fr-checkbox-group"
                            key={périmètreMinistériel.id}
                          >
                            <input
                              checked={estActif(périmètreMinistériel.id, catégorieDeFiltre)}
                              id={`case-à-cocher-${catégorieDeFiltre}-${périmètreMinistériel.id}`}
                              name={`case-à-cocher-${catégorieDeFiltre}-${périmètreMinistériel.id}`}
                              onChange={événement => changementDeLÉtatDuFiltreCallback(événement.target.checked, périmètreMinistériel)}
                              type="checkbox"
                            />
                            <label
                              className="fr-label fr-p-1w libellé"
                              htmlFor={`case-à-cocher-${catégorieDeFiltre}-${périmètreMinistériel.id}`}
                            >
                              {périmètreMinistériel.nom}
                            </label>
                          </li>
                        ))
                      }
                    </ul>
                  </li>
                </Fragment>
              );
            })
          }
        </ul>
      </div>
    </FiltresMinistèresStyled>
  );
}
