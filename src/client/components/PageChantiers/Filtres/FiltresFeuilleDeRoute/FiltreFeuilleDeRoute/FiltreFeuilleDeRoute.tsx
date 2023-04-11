import '@gouvfr/dsfr/dist/component/toggle/toggle.min.css';
import { useCallback } from 'react';
import { actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';
import FiltreFeuilleDeRouteProps from './FiltreFeuilleDeRoute.interface';

export default function FiltreFeuilleDeRoute({ filtre }: FiltreFeuilleDeRouteProps) {
  const { activerUnFiltre, désactiverUnFiltre, estActif } = actionsFiltresStore();

  const auClicSurUnPérimètreCallback = useCallback(() => {
    if (estActif(filtre.id, 'filtresFeuilleDeRoute')) {
      désactiverUnFiltre(filtre.id, 'filtresFeuilleDeRoute');
    } else {
      activerUnFiltre(filtre, 'filtresFeuilleDeRoute');
    }
  }, [activerUnFiltre, désactiverUnFiltre, estActif, filtre]);

  return (
    <div className="fr-toggle">
      <input
        checked={estActif(filtre.id, 'filtresFeuilleDeRoute')}
        className="fr-toggle__input"
        id={`interrupteur-${filtre.id}`}
        onChange={() => auClicSurUnPérimètreCallback()}
        type="checkbox"
      />
      <label
        className="fr-toggle__label fr-pl-2w"
        htmlFor={`interrupteur-${filtre.id}`}
      >
        {filtre.nom}
      </label>
    </div>
  );
}
