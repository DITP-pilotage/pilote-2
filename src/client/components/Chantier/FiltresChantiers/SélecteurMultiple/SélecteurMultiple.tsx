import SélecteurMultipleProps from './SélecteurMultiple.interface';
import '@gouvfr/dsfr/dist/component/checkbox/checkbox.min.css';
import '@gouvfr/dsfr/dist/component/form/form.min.css';
import PérimètreMinistériel from 'server/domain/périmètreMinistériel/périmètreMinistériel.interface';
import useFiltresStore from 'client/stores/useFiltresStore/useFiltresStore';
import { useCallback } from 'react';

export default function SélecteurMultiple({ libellé, catégorieDeFiltre, filtres }: SélecteurMultipleProps) {
  const activerUnFiltre = useFiltresStore(étatActuel => étatActuel.activerUnFiltre);
  const désactiverUnFiltre = useFiltresStore(étatActuel => étatActuel.désactiverUnFiltre);
  
  const changementDeLÉtatDuFiltreCallback = useCallback((estSélectionné: boolean, id: PérimètreMinistériel['id']) => {
    return estSélectionné ? activerUnFiltre(id, catégorieDeFiltre) : désactiverUnFiltre(id, catégorieDeFiltre);
  }, [activerUnFiltre, désactiverUnFiltre, catégorieDeFiltre]);

  return (
    <div className="fr-form-group">
      <fieldset className="fr-fieldset">
        <legend className="fr-fieldset__legend fr-text--regular">
          { libellé }
        </legend>
        <div className="fr-fieldset__content">
          {
            filtres.map(filtre => (
              <div
                className="fr-checkbox-group"
                key={filtre.id}
              >
                <input
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
            ))
          }
        </div>
      </fieldset>
    </div>
  );
}
