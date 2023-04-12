import '@gouvfr/dsfr/dist/component/toggle/toggle.min.css';
import { useCallback } from 'react';
import { actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';
import FiltreTypologieProps from './FiltreTypologie.interface';

export default function FiltreTypologie({ filtre }: FiltreTypologieProps) {
  const { activerUnFiltre, désactiverUnFiltre, estActif } = actionsFiltresStore();

  const auClicSurUnPérimètreCallback = useCallback(() => {
    if (estActif(filtre.id, 'filtresTypologie')) {
      désactiverUnFiltre(filtre.id, 'filtresTypologie');
    } else {
      activerUnFiltre(filtre, 'filtresTypologie');
    }
  }, [activerUnFiltre, désactiverUnFiltre, estActif, filtre]);

  return (
    <div className="fr-toggle">
      <input
        checked={estActif(filtre.id, 'filtresTypologie')}
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
