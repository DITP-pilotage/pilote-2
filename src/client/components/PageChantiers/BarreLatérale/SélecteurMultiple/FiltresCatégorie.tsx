import '@gouvfr/dsfr/dist/component/checkbox/checkbox.min.css';
import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/component/sidemenu/sidemenu.min.css';
import { Fragment, useCallback } from 'react';
import { actions as actionsFiltresStore, filtresActifs as filtresActifsStore } from '@/stores/useFiltresStore/useFiltresStore';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import SélecteurMultipleProps from './SélecteurMultiple.interface';
import SélecteurMultipleStyled from './SélecteurMultiple.styled';

const FILTRES = [
  {
    id: 'MIN-001',
    nom: 'Agriculture et Alimentation',
    périmètresMinistériels: [
      { id: 'PER-001', nom: 'Agriculture' },
      { id: 'PER-002', nom: 'Alimentation' },
    ],
  },
  {
    id: 'MIN-002',
    nom: 'Cohésion des territoires et relations avec les collectivités territoriales',
    périmètresMinistériels: [
      { id: 'PER-003', nom: 'Cohésion des territoires, ville' },
      { id: 'PER-004', nom: 'Aménagement du territoire' },
      { id: 'PER-005', nom: 'Logement' },
    ],
  },
];


export default function FiltresCatégorie({ libellé, catégorieDeFiltre, filtres }: SélecteurMultipleProps) {
  const { activerUnFiltre, désactiverUnFiltre, estActif } = actionsFiltresStore();

  const changementDeLÉtatDuFiltreCallback = useCallback((estSélectionné: boolean, filtre: PérimètreMinistériel) => {
    return estSélectionné ? activerUnFiltre(filtre, catégorieDeFiltre) : désactiverUnFiltre(filtre.id, catégorieDeFiltre);
  }, [activerUnFiltre, désactiverUnFiltre, catégorieDeFiltre]);

  const nombreFiltresActifCatégorie = actionsFiltresStore().récupérerNombreFiltresActifsDUneCatégorie(catégorieDeFiltre);

  return (
    <SélecteurMultipleStyled className="fr-form-group">
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
            FILTRES.map((filtre) => {
              return (
                <Fragment key={filtre.id}>
                  <li>
                    <div className="fr-label fr-p-1w libellé">
                      {filtre.nom}
                    </div>
                    <ul className="fitres-liste">
                      {
                        filtre.périmètresMinistériels.map(périmètreMinistériel => (
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
    </SélecteurMultipleStyled>
  );
}
