import { useCallback } from 'react';
import { actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';
import Interrupteur from '@/components/_commons/Interrupteur/Interrupteur';
import FiltreTypologieProps from './FiltreTypologie.interface';

export default function FiltreTypologie({ filtre }: FiltreTypologieProps) {
  const { activerUnFiltre, désactiverUnFiltre, estActif } = actionsFiltresStore();

  const auChangement = useCallback((estCochée: boolean) => {
    if (estCochée) {
      activerUnFiltre(filtre, 'filtresTypologie');
    } else {
      désactiverUnFiltre(filtre.id, 'filtresTypologie');
    }
  }, [activerUnFiltre, désactiverUnFiltre, filtre]);

  return (
    <Interrupteur
      auChangement={auChangement}
      checked={estActif(filtre.id, 'filtresTypologie')}
      id={filtre.id}
      libellé={filtre.nom}
    />
  );
}
