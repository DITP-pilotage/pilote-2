import { useCallback } from 'react';
import { actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';
import Interrupteur from '@/components/_commons/Interrupteur/Interrupteur';
import FiltreStatutProps from './FiltreStatut.interface';

export default function FiltreStatut( { filtre } : FiltreStatutProps) {
  const { activerUnFiltre, désactiverUnFiltre, estActif } = actionsFiltresStore();

  const auChangement = useCallback((estCochée: boolean) => {
    if (estCochée) {
      activerUnFiltre( filtre, 'filtresStatut');
    } else {
      désactiverUnFiltre(filtre.id, 'filtresStatut');
    }
  }, [activerUnFiltre, désactiverUnFiltre, filtre]);

  return (
    <Interrupteur
      auChangement={auChangement}
      checked={estActif(filtre.id, 'filtresStatut')}
      id={filtre.id}
      libellé={filtre.nom}
    />
  );
}
