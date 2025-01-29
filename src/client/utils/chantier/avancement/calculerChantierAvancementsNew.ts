import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { AgrégateurChantiersParTerritoire } from '@/client/utils/chantier/agrégateur/agrégateur';
import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';
import { ChantierRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';

export default function calculerChantierAvancements(
  chantier: ChantierRapportDetailleContrat,
  mailleSélectionnée: MailleInterne,
  territoireCode: string,
  territoireCodeParent: string | null,
  avancementsAgrégés: AvancementsStatistiques,
) {

  const donnéesTerritoiresAgrégées = new AgrégateurChantiersParTerritoire(chantier).agréger();

  const avancementRégional = ( typeTauxAvancement: 'global' | 'annuel' ) => {
    const { maille } = territoireCodeVersMailleCodeInsee(territoireCode);

    return maille === 'REG'
      ? donnéesTerritoiresAgrégées.regionale.territoires[territoireCode].répartition.avancements[typeTauxAvancement]
      : maille === 'DEPT' && territoireCodeParent
        ? donnéesTerritoiresAgrégées.regionale.territoires[territoireCodeParent].répartition.avancements[typeTauxAvancement]
        : null;
  };

  const avancementDépartemental = ( typeTauxAvancement: 'global' | 'annuel' ) => {
    const { maille } = territoireCodeVersMailleCodeInsee(territoireCode);

    return maille === 'DEPT' ? donnéesTerritoiresAgrégées[mailleSélectionnée].territoires[territoireCode].répartition.avancements[typeTauxAvancement] : null;
  };

  console.log(avancementsAgrégés?.global);

  return {
    nationale: {
      global: {
        moyenne: donnéesTerritoiresAgrégées.nationale.répartition.avancements.global.moyenne,
        médiane: avancementsAgrégés?.global.médiane ?? null,
        minimum: avancementsAgrégés?.global.minimum ?? null,
        maximum: avancementsAgrégés?.global.maximum ?? null,
      },
      annuel: {
        moyenne: donnéesTerritoiresAgrégées.nationale.répartition.avancements.annuel.moyenne,
      },
    },
    departementale: {
      global: {
        moyenne: avancementDépartemental('global'),
      },
      annuel: {
        moyenne: avancementDépartemental('annuel'),
      },
    },
    regionale: {
      global: {
        moyenne: avancementRégional('global'),
      },
      annuel: {
        moyenne: avancementRégional('annuel'),
      },
    },
  };
}
