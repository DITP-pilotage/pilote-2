import { useMemo } from 'react';
import Chantier, { ChantierVueDEnsemble } from '@/server/domain/chantier/Chantier.interface';
import { AgrégateurChantiersParTerritoire } from '@/client/utils/chantier/agrégateur/agrégateur';
import {
  mailleSélectionnéeTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { objectEntries } from '@/client/utils/objects/objects';
import api from '@/server/infrastructure/api/trpc/api';
import CompteurFiltre from '@/client/utils/filtres/CompteurFiltre';

export default function useVueDEnsemble(chantiersFiltrés: Chantier[]) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const donnéesTerritoiresAgrégées = useMemo(() => {
    return new AgrégateurChantiersParTerritoire(chantiersFiltrés).agréger();
  }, [chantiersFiltrés]);

  let { data: avancementsAgrégés } = api.chantier.récupérerStatistiquesAvancements.useQuery(
    {
      chantiers: chantiersFiltrés.map(chantier => (chantier.id)),
      maille: mailleSélectionnée,
    },
    { keepPreviousData: true },
  );
  if (avancementsAgrégés)
    avancementsAgrégés.global.moyenne = donnéesTerritoiresAgrégées[territoireSélectionné!.maille].territoires[territoireSélectionné!.codeInsee].répartition.avancements.global.moyenne;

  const compteurFiltre = new CompteurFiltre(chantiersFiltrés);

  const filtresComptesCalculés = compteurFiltre.compter([{
    nomCritère: 'orage',
    condition: (chantier) => (
      (territoireSélectionné && chantier.mailles[territoireSélectionné.maille][territoireSélectionné.codeInsee].météo === 'ORAGE') ?? false),
  }, {
    nomCritère: 'couvert',
    condition: (chantier) => (
      (territoireSélectionné && chantier.mailles[territoireSélectionné.maille][territoireSélectionné.codeInsee].météo === 'COUVERT') ?? false),
  }, {
    nomCritère: 'nuage',
    condition: (chantier) => (
      (territoireSélectionné && chantier.mailles[territoireSélectionné.maille][territoireSélectionné.codeInsee].météo === 'NUAGE') ?? false),
  }, {
    nomCritère: 'soleil',
    condition: (chantier) => (
      (territoireSélectionné && chantier.mailles[territoireSélectionné.maille][territoireSélectionné.codeInsee].météo === 'SOLEIL') ?? false),
  }]);

  const répartitionMétéos = {
    ORAGE: filtresComptesCalculés.orage.nombre,
    COUVERT: filtresComptesCalculés.couvert.nombre,
    NUAGE: filtresComptesCalculés.nuage.nombre,
    SOLEIL: filtresComptesCalculés.soleil.nombre,
  };

  const avancementsGlobauxTerritoriauxMoyens = useMemo(() => {
    return objectEntries(donnéesTerritoiresAgrégées[mailleSélectionnée].territoires).map(([codeInsee, territoire]) => ({
      valeur: territoire.répartition.avancements.global.moyenne,
      codeInsee: codeInsee,
    }));
  }, [donnéesTerritoiresAgrégées, mailleSélectionnée]);

  const chantiersVueDEnsemble: ChantierVueDEnsemble[] = chantiersFiltrés.map(chantier => ({
    id: chantier.id,
    nom: chantier.nom,
    avancement: chantier.mailles[territoireSélectionné!.maille][territoireSélectionné!.codeInsee].avancement.global,
    météo: chantier.mailles[territoireSélectionné!.maille][territoireSélectionné!.codeInsee].météo,
    typologie: { estBaromètre: chantier.estBaromètre, estTerritorialisé: chantier.estTerritorialisé },
    porteur: chantier.responsables.porteur,
  }));

  return {
    avancementsAgrégés: avancementsAgrégés ?? null,
    répartitionMétéos,
    avancementsGlobauxTerritoriauxMoyens,
    chantiersVueDEnsemble,
  };
}
