import '@gouvfr/dsfr/dist/component/checkbox/checkbox.min.css';
import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/component/sidemenu/sidemenu.min.css';
import { Fragment, useCallback } from 'react';
import { actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/périmètreMinistériel.interface';
import BarreDeRecherche from '@/components/_commons/BarreDeRecherche/BarreDeRecherche';
import SélecteurMultipleProps from './SélecteurMultiple.interface';
import styles from './SélecteurMultiple.module.scss';

export default function SélecteurMultiple({ libellé, catégorieDeFiltre, filtres }: SélecteurMultipleProps) {
  const { activerUnFiltre, désactiverUnFiltre, estActif } = actionsFiltresStore();

  const changementDeLÉtatDuFiltreCallback = useCallback((estSélectionné: boolean, id: PérimètreMinistériel['id']) => {
    return estSélectionné ? activerUnFiltre(id, catégorieDeFiltre) : désactiverUnFiltre(id, catégorieDeFiltre);
  }, [activerUnFiltre, désactiverUnFiltre, catégorieDeFiltre]);

  return (
    <div className="fr-form-group">
      <button
        aria-controls={`fr-sidemenu-item-${catégorieDeFiltre}`}
        aria-expanded="false"
        className="fr-sidemenu__btn"
        type='button'
      >
        { libellé }
      </button>
      <div
        className="fr-collapse fr-pt-1w fr-px-1w"
        id={`fr-sidemenu-item-${catégorieDeFiltre}`}
      >
        <BarreDeRecherche
          changementDeLaRechercheCallback={()=> {}}
          valeur=''
        />
        <div className={`${styles.choixFiltres}`}>
          {
            filtres.map(filtre => (
              <Fragment key={filtre.id}>
                <div
                  className="fr-checkbox-group fr-py-3v"
                  key={filtre.id}
                >
                  <input
                    defaultChecked={estActif(filtre.id, catégorieDeFiltre)}
                    id={`case-à-cocher-${catégorieDeFiltre}-${filtre.id}`}
                    name={`case-à-cocher-${catégorieDeFiltre}-${filtre.id}`}
                    onChange={événement => changementDeLÉtatDuFiltreCallback(événement.target.checked, filtre.id)}
                    type="checkbox"
                  />
                  <label
                    className="fr-label"
                    htmlFor={`case-à-cocher-${catégorieDeFiltre}-${filtre.id}`}
                  >
                    {filtre.nom}
                  </label>
                </div>
                <hr className='fr-hr flex fr-pb-1v fr-mx-1w' />
              </Fragment>
            ))
          }
        </div>
      </div>
    </div>
  );
}
