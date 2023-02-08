import '@gouvfr/dsfr/dist/component/toggle/toggle.min.css';
import { useCallback } from 'react';
import { actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';
import FiltreBaromètreProps from './FiltreBaromètre.interface';

const filtreBaromètre = { id: 'filtreBaromètre', attribut: 'estBaromètre', nom: 'Chantiers du baromètre' };

export default function FiltreBaromètre({ catégorieDeFiltre }: FiltreBaromètreProps) {
  const { activerUnFiltre, désactiverUnFiltre, estActif } = actionsFiltresStore();

  const auClicSurUnPérimètreCallback = useCallback(() => {
    if (estActif(filtreBaromètre.id, catégorieDeFiltre)) {
      désactiverUnFiltre(filtreBaromètre.id, catégorieDeFiltre);
    } else {
      activerUnFiltre(filtreBaromètre, catégorieDeFiltre);
    }
  }, [activerUnFiltre, catégorieDeFiltre, désactiverUnFiltre, estActif]);

  return (
    <div className="fr-toggle">
      <input
        checked={estActif(filtreBaromètre.id, catégorieDeFiltre)}
        className="fr-toggle__input"
        id="interrupteur-filtre-baromètre"
        onChange={() => auClicSurUnPérimètreCallback()}
        type="checkbox"
      />
      <label
        className="fr-toggle__label fr-pl-2w"
        htmlFor="interrupteur-filtre-baromètre"
      >
        Chantiers du Baromètre
      </label>
    </div>
  );
}
