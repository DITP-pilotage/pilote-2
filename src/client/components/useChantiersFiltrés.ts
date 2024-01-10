import { useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import {
  filtresActifs as filtresActifsStore,
  désactiverUnFiltreFn,
} from '@/stores/useFiltresStore/useFiltresStore';
import Alerte from '@/server/domain/alerte/Alerte';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { statutsSélectionnésStore } from '@/stores/useStatutsStore/useStatutsStore';

export default function useChantiersFiltrés(chantiers: Chantier[]) {
  const { data: session } = useSession();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const filtresActifs = filtresActifsStore();
  const statutsSélectionnés = statutsSélectionnésStore();

  const chantiersFiltrésSansFiltreAlerte = useMemo(() => {
    let résultat: Chantier[] = chantiers;

    if (session?.profil === 'DROM' && territoireSélectionné?.code === 'NAT-FR') {
      résultat = résultat.filter(chantier => chantier.périmètreIds.includes('PER-018'));
    }

    if (territoireSélectionné?.code !== 'NAT-FR') {
      const maille = territoireSélectionné?.maille as MailleInterne;
      résultat = résultat.filter(chantier => {
        return chantier.estTerritorialisé || chantier.tauxAvancementDonnéeTerritorialisée[maille] || chantier.météoDonnéeTerritorialisée[maille]; 
      });
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

    if (statutsSélectionnés.length > 0) {
      résultat = résultat.filter(chantier => (
        statutsSélectionnés.includes(chantier.statut)
      ));      
    }
    return résultat;
  }, [chantiers, filtresActifs, session?.profil, territoireSélectionné, statutsSélectionnés]);

  const chantiersFiltrés = useMemo(() => {
    let résultat: Chantier[] = chantiersFiltrésSansFiltreAlerte;

    if (filtresActifs.filtresAlerte.length > 0) {
      résultat = résultat.filter(chantier => {
        return filtresActifs.filtresAlerte.some(filtre => {
          const chantierDonnéesTerritoires = chantier.mailles[territoireSélectionné!.maille][territoireSélectionné!.codeInsee];
          return (filtre.id === 'estEnAlerteÉcart' && Alerte.estEnAlerteÉcart(chantierDonnéesTerritoires.écart))
            || (filtre.id === 'estEnAlerteBaisseOuStagnation' && Alerte.estEnAlerteBaisseOuStagnation(chantierDonnéesTerritoires.avancementPrécédent.global, chantierDonnéesTerritoires.avancement.global))
            || (filtre.id === 'estEnAlerteDonnéesNonMàj' && Alerte.estEnAlerteDonnéesNonMàj(chantierDonnéesTerritoires.dateDeMàjDonnéesQualitatives, chantierDonnéesTerritoires.dateDeMàjDonnéesQuantitatives));
        });
      });
    }
    return résultat;
  }, [chantiersFiltrésSansFiltreAlerte, filtresActifs.filtresAlerte, territoireSélectionné]);

  useEffect(() => {
    if (territoireSélectionné?.maille === 'nationale') {
      désactiverUnFiltreFn('estEnAlerteÉcart', 'filtresAlerte');
    }
  }, [territoireSélectionné?.maille]);


  return {
    chantiersFiltrésSansFiltreAlerte,
    chantiersFiltrés,
  };
}
