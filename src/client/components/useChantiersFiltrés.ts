import { useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { désactiverUnFiltreFn, filtresActifs as filtresActifsStore } from '@/stores/useFiltresStore/useFiltresStore';
import Alerte from '@/server/domain/alerte/Alerte';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { statutsSélectionnésStore } from '@/stores/useStatutsStore/useStatutsStore';
import { ChantierAccueilContrat } from '@/server/chantiers/app/contrats/ChantierAccueilContrat';
import { ChantierRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';

const masquerPourDROM = (sessionProfil: string, territoireCode: string) => {
  return sessionProfil === 'DROM' && territoireCode === 'NAT-FR';
};

export default function useChantiersFiltrés(chantiers: (ChantierAccueilContrat | ChantierRapportDetailleContrat)[]) {
  const { data: session } = useSession();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const filtresActifs = filtresActifsStore();
  const statutsSélectionnés = statutsSélectionnésStore();

  const chantiersFiltrésSansFiltreAlerte = useMemo(() => {
    let résultat: (ChantierAccueilContrat | ChantierRapportDetailleContrat)[] = chantiers;

    if (territoireSélectionné) {
      résultat = résultat.filter(chantier =>
        !!chantier.mailles[territoireSélectionné.maille][territoireSélectionné.codeInsee].estApplicable
        && statutsSélectionnés.includes(chantier.statut));
    }

    if (masquerPourDROM(session!.profil, territoireSélectionné!.code)) {
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
    if (filtresActifs.filtresTypologie.length > 0) {
      résultat = résultat.filter(chantier => (
        filtresActifs.filtresTypologie.some(filtre => chantier[filtre.attribut])
      ));
    }

    return résultat;
  }, [chantiers, territoireSélectionné, session, filtresActifs.périmètresMinistériels, filtresActifs.axes, filtresActifs.filtresTypologie, statutsSélectionnés]);

  const chantiersFiltrés = useMemo(() => {
    let résultat: (ChantierAccueilContrat | ChantierRapportDetailleContrat)[] = chantiersFiltrésSansFiltreAlerte;
   
    if (filtresActifs.filtresAlerte.length > 0) {
   
      résultat = résultat.filter(chantier => {
   
        return filtresActifs.filtresAlerte.some(filtre => {
          const chantierDonnéesTerritoires = chantier.mailles[territoireSélectionné!.maille][territoireSélectionné!.codeInsee];
          return (filtre.id === 'estEnAlerteÉcart' && Alerte.estEnAlerteÉcart(chantierDonnéesTerritoires.écart))
            || (filtre.id === 'estEnAlerteBaisseOuStagnation' && Alerte.estEnAlerteBaisseOuStagnation(chantierDonnéesTerritoires.tendance))
            || (filtre.id === 'estEnAlerteDonnéesNonMàj' && Alerte.estEnAlerteDonnéesNonMàj(chantierDonnéesTerritoires.dateDeMàjDonnéesQualitatives, chantierDonnéesTerritoires.dateDeMàjDonnéesQuantitatives))
            || (filtre.id === 'estEnAlerteTauxAvancementNonCalculé' && Alerte.estEnAlerteTauxAvancementNonCalculé(chantierDonnéesTerritoires.avancement.global))
            || (filtre.id === 'estEnAlerteMétéoNonRenseignée' && Alerte.estEnAlerteMétéoNonRenseignée(chantierDonnéesTerritoires.météo));
        });
      });
    }
    return résultat;
  }, [chantiersFiltrésSansFiltreAlerte, filtresActifs.filtresAlerte, territoireSélectionné]);

  useEffect(() => {

    if (territoireSélectionné?.maille === 'nationale') {
      désactiverUnFiltreFn('estEnAlerteÉcart', 'filtresAlerte');
    } else {
      désactiverUnFiltreFn('estEnAlerteTauxAvancementNonCalculé', 'filtresAlerte');
    }
  }, [territoireSélectionné?.maille]);


  return {
    chantiersFiltrésSansFiltreAlerte,
    chantiersFiltrés,
  };
}
