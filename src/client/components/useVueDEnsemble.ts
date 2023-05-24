import { useMemo } from 'react';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { AgrégateurChantiersParTerritoire } from '@/client/utils/chantier/agrégateur/agrégateur';
import {
  mailleSélectionnéeTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { objectEntries } from '@/client/utils/objects/objects';
import { Météo } from '@/server/domain/météo/Météo.interface';
import api from '@/server/infrastructure/api/trpc/api';
import Ministère from '@/server/domain/ministère/Ministère.interface';

export type ChantierVueDEnsemble = {
  id: string;
  nom: string;
  avancement: number | null;
  météo: Météo;
  typologie: { estBaromètre: boolean, estTerritorialisé: boolean };
  porteur: Ministère | null;
};

export default function useVueDEnsemble(chantiers: Chantier[]) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const donnéesTerritoiresAgrégées = useMemo(() => {
    return new AgrégateurChantiersParTerritoire(chantiers).agréger();
  }, [chantiers]);

  let { data: avancementsAgrégés } = api.chantier.récupérerStatistiquesAvancements.useQuery(
    {
      chantiers: chantiers.map(chantier => (chantier.id)),
      maille: mailleSélectionnée,
    },
    { keepPreviousData: true },
  );
  if (avancementsAgrégés)
    avancementsAgrégés.global.moyenne = donnéesTerritoiresAgrégées[territoireSélectionné!.maille].territoires[territoireSélectionné!.codeInsee].répartition.avancements.global.moyenne;

  const répartitionMétéos = donnéesTerritoiresAgrégées[territoireSélectionné!.maille].territoires[territoireSélectionné!.codeInsee].répartition.météos;

  const avancementsGlobauxTerritoriauxMoyens = useMemo(() => {
    return objectEntries(donnéesTerritoiresAgrégées[mailleSélectionnée].territoires).map(([codeInsee, territoire]) => ({
      valeur: territoire.répartition.avancements.global.moyenne,
      codeInsee: codeInsee,
    }));
  }, [donnéesTerritoiresAgrégées, mailleSélectionnée]);

  const chantiersVueDEnsemble: ChantierVueDEnsemble[] = chantiers.map(chantier => ({
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
