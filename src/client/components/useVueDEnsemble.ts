import { useMemo } from 'react';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { AgrégateurChantiersParTerritoire } from '@/client/utils/chantier/agrégateur/agrégateur';
import { filtresActifs as filtresActifsStore } from '@/stores/useFiltresStore/useFiltresStore';
import {
  mailleAssociéeAuTerritoireSélectionnéTerritoiresStore,
  mailleSélectionnéeTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { objectEntries } from '@/client/utils/objects/objects';
import { Météo } from '@/server/domain/météo/Météo.interface';

export type ChantierVueDEnsemble = {
  id: string;
  nom: string;
  avancement: number | null;
  météo: Météo;
  typologie: { estBaromètre: boolean, estTerritorialisé: boolean };
  porteur: string;
};

export default function useVueDEnsemble(chantiers: Chantier[]) {
  const filtresActifs = filtresActifsStore();
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
    if (filtresActifs.filtresTypologie.length > 0) {
      résultat = résultat.filter(chantier => (
        filtresActifs.filtresTypologie.every(filtre => (chantier[filtre.attribut]))
      ));
    }
    return résultat;
  }, [chantiers, filtresActifs]);

  const donnéesTerritoiresAgrégées = useMemo(() => {
    return new AgrégateurChantiersParTerritoire(chantiersFiltrés).agréger();
  }, [chantiersFiltrés]);

  const avancementsAgrégés = {
    global: {
      moyenne: donnéesTerritoiresAgrégées[mailleAssociéeAuTerritoireSélectionné].territoires[territoireSélectionné.codeInsee].répartition.avancements.global.moyenne,
      médiane: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.global.médiane,
      minimum: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.global.minimum,
      maximum: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.global.maximum,
    },
    annuel: {
      moyenne: donnéesTerritoiresAgrégées[mailleAssociéeAuTerritoireSélectionné].territoires[territoireSélectionné.codeInsee].répartition.avancements.annuel.moyenne,
    },
  };

  const répartitionMétéos = donnéesTerritoiresAgrégées[mailleAssociéeAuTerritoireSélectionné].territoires[territoireSélectionné.codeInsee].répartition.météos;

  const avancementsGlobauxTerritoriauxMoyens = useMemo(() => {
    return objectEntries(donnéesTerritoiresAgrégées[mailleSélectionnée].territoires).map(([codeInsee, territoire]) => ({
      valeur: territoire.répartition.avancements.global.moyenne,
      codeInsee: codeInsee,
    }));
  }, [donnéesTerritoiresAgrégées, mailleSélectionnée]);

  const chantiersVueDEnsemble: ChantierVueDEnsemble[] = chantiersFiltrés.map(chantier => ({
    id: chantier.id,
    nom: chantier.nom,
    avancement: chantier.mailles[maille][territoireSélectionné.codeInsee].avancement.global,
    météo: chantier.mailles[maille][territoireSélectionné.codeInsee].météo,
    typologie: { estBaromètre: chantier.estBaromètre, estTerritorialisé: chantier.estTerritorialisé },
    porteur: chantier.responsables.porteur,
  }));

  return {
    chantiersFiltrés,
    avancementsAgrégés,
    répartitionMétéos,
    avancementsGlobauxTerritoriauxMoyens,
    chantiersVueDEnsemble,
  };
}
