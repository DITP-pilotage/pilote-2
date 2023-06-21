import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { filtresActifs as filtresActifsStore } from '@/stores/useFiltresStore/useFiltresStore';

export default function useChantiersFiltrés(chantiers: Chantier[]) {
  const { data: session } = useSession();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const filtresActifs = filtresActifsStore();

  const chantiersFiltrésSansFiltreAlerte = useMemo(() => {
    let résultat: Chantier[] = chantiers;

    if (session?.profil === 'DROM' && territoireSélectionné?.code === 'NAT-FR') {
      résultat = résultat.filter(chantier => chantier.périmètreIds.includes('PER-018'));
    }

    if (filtresActifs.périmètresMinistériels.length > 0) {
      résultat = résultat.filter(chantier => {
        const périmètrePorteur = chantier.responsables.porteur?.périmètresMinistériels.find(pm => chantier.périmètreIds.includes(pm.id));
        return filtresActifs.périmètresMinistériels.some(filtre => périmètrePorteur?.id === filtre.id);
      });
    }
    if (filtresActifs.axes.length > 0) {
      résultat = résultat.filter(chantier => (
        filtresActifs.axes.some(filtre => chantier.axe === filtre.nom)
      ));
    }
    if (filtresActifs.ppg.length > 0) {
      résultat = résultat.filter(chantier => (
        filtresActifs.ppg.some(filtre => chantier.ppg === filtre.nom)
      ));
    }
    if (filtresActifs.filtresTypologie.length > 0) {
      résultat = résultat.filter(chantier => (
        filtresActifs.filtresTypologie.some(filtre => chantier[filtre.attribut])
      ));
    }
    return résultat;
  }, [chantiers, filtresActifs, session?.profil, territoireSélectionné]);

  const chantiersFiltrés = useMemo(() => {
    let résultat: Chantier[] = chantiersFiltrésSansFiltreAlerte;

    if (filtresActifs.filtresAlerte.length > 0) {
      résultat = résultat.filter(chantier => {        
        return filtresActifs.filtresAlerte.some(filtre => (
          chantier.mailles[territoireSélectionné!.maille][territoireSélectionné!.codeInsee].alertes[filtre.id]),
        );
      });
    }
    return résultat;
  }, [chantiersFiltrésSansFiltreAlerte, filtresActifs.filtresAlerte, territoireSélectionné]);

  return {
    chantiersFiltrésSansFiltreAlerte,
    chantiersFiltrés,
  };
}
