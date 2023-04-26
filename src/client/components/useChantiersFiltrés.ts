import { useMemo } from 'react';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { filtresActifs as filtresActifsStore } from '@/stores/useFiltresStore/useFiltresStore';

export default function useChantiersFiltrés(chantiers: Chantier[]) {
  const filtresActifs = filtresActifsStore();

  // eslint-disable-next-line sonarjs/prefer-immediate-return
  const chantiersFiltrés = useMemo(() => {
    let résultat: Chantier[] = chantiers;

    if (filtresActifs.périmètresMinistériels.length > 0) {
      résultat = résultat.filter(chantier => (
        filtresActifs.périmètresMinistériels.some(filtre => (chantier.périmètreIds.includes(filtre.id)))
      ));
    }
    if (filtresActifs.axes.length > 0) {
      résultat = résultat.filter(chantier => (
        filtresActifs.axes.some(filtre => (chantier.axe === filtre.nom))
      ));
    }
    if (filtresActifs.ppg.length > 0) {
      résultat = résultat.filter(chantier => (
        filtresActifs.ppg.some(filtre => (chantier.ppg === filtre.nom))
      ));
    }
    if (filtresActifs.filtresTypologie.length > 0) {
      résultat = résultat.filter(chantier => (
        filtresActifs.filtresTypologie.every(filtre => (chantier[filtre.attribut]))
      ));
    }
    return résultat;
  }, [chantiers, filtresActifs]);

  return chantiersFiltrés;
}
