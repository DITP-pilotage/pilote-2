import { useMemo } from 'react';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { AgrégateurChantiersParTerritoire } from '@/client/utils/chantier/agrégateur/agrégateur';
import { actions as actionsFiltresStore, filtresActifs as filtresActifsStore } from '@/stores/useFiltresStore/useFiltresStore';
import {
  mailleAssociéeAuTerritoireSélectionnéTerritoiresStore,
  mailleSélectionnéeTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { objectEntries } from '@/client/utils/objects/objects';

export default function usePageChantiers(chantiers: Chantier[]) {
  const filtresActifs = filtresActifsStore();
  const { récupérerNombreFiltresActifs } = actionsFiltresStore();
  const maille = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const mailleAssociéeAuTerritoireSélectionné = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

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
    if (filtresActifs.autresFiltres.length > 0) {
      résultat = résultat.filter(chantier => (
        filtresActifs.autresFiltres.some(filtre => (chantier[filtre.attribut as keyof Chantier]))
      ));
    }
    return résultat;
  }, [chantiers, filtresActifs]);

  const donnéesTerritoiresAgrégées = useMemo(() => {
    return new AgrégateurChantiersParTerritoire(chantiersFiltrés).agréger();
  }, [chantiersFiltrés]);

  const avancements = {
    moyenne: donnéesTerritoiresAgrégées[mailleAssociéeAuTerritoireSélectionné].territoires[territoireSélectionné.codeInsee].répartition.avancements.global.moyenne,
    moyenneAnnuelle: donnéesTerritoiresAgrégées[mailleAssociéeAuTerritoireSélectionné].territoires[territoireSélectionné.codeInsee].répartition.avancements.annuel.moyenne,
    médiane: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.global.médiane,
    minimum: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.global.minimum,
    maximum: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.global.maximum,
  };

  const météos = donnéesTerritoiresAgrégées[mailleAssociéeAuTerritoireSélectionné].territoires[territoireSélectionné.codeInsee].répartition.météos;

  const donnéesCartographie = useMemo(() => {
    return objectEntries(donnéesTerritoiresAgrégées[mailleSélectionnée].territoires).map(([codeInsee, territoire]) => ({
      valeur: territoire.répartition.avancements.global.moyenne,
      codeInsee: codeInsee,
    }));
  }, [donnéesTerritoiresAgrégées, mailleSélectionnée]);

  const donnéesTableauChantiers = chantiersFiltrés.map(chantier => ({
    id: chantier.id,
    nom: chantier.nom,
    avancement: chantier.mailles[maille][territoireSélectionné.codeInsee].avancement.global,
    météo: chantier.mailles[maille][territoireSélectionné.codeInsee].météo,
    estBaromètre: chantier.estBaromètre,
    estTerritorialisé: chantier.estTerritorialisé,
    porteur: chantier.responsables.porteur,
  }));

  return {
    nombreFiltresActifs: récupérerNombreFiltresActifs(),
    chantiersFiltrés,
    avancements,
    météos,
    donnéesCartographie,
    donnéesTableauChantiers,
  };
}
