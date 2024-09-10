import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { AgrégateurChantiersParTerritoire } from '@/client/utils/chantier/agrégateur/agrégateur';
import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';
import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';
import { ChantierRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';

export default function calculerChantierAvancements(
  chantier: ChantierRapportDetailleContrat,
  mailleSélectionnée: MailleInterne,
  territoireSélectionné: DétailTerritoire,
  territoireParent: DétailTerritoire | null,
  avancementsAgrégés: AvancementsStatistiques,
) {
  
  const donnéesTerritoiresAgrégées = new AgrégateurChantiersParTerritoire(chantier).agréger();

  const avancementRégional = ( typeTauxAvancement: 'global' | 'annuel' ) => {
    if (territoireSélectionné.maille === 'régionale')
      return donnéesTerritoiresAgrégées.régionale.territoires[territoireSélectionné.codeInsee].répartition.avancements[typeTauxAvancement];

    if (territoireSélectionné.maille === 'départementale' && territoireParent)
      return donnéesTerritoiresAgrégées.régionale.territoires[territoireParent.codeInsee].répartition.avancements[typeTauxAvancement];
  };

  const avancementDépartemental = ( typeTauxAvancement: 'global' | 'annuel' ) => {
    if (territoireSélectionné.maille === 'départementale')
      return donnéesTerritoiresAgrégées[mailleSélectionnée].territoires[territoireSélectionné.codeInsee].répartition.avancements[typeTauxAvancement];
  };

  return {
    nationale: {
      global: {
        moyenne: donnéesTerritoiresAgrégées.nationale.répartition.avancements.global.moyenne,
        médiane: avancementsAgrégés?.global.médiane,
        minimum: avancementsAgrégés?.global.minimum,
        maximum: avancementsAgrégés?.global.maximum,
      },
      annuel: {
        moyenne: donnéesTerritoiresAgrégées.nationale.répartition.avancements.annuel.moyenne,
      },
    },
    départementale: {
      global: {
        moyenne: avancementDépartemental('global'),
      },
      annuel: {
        moyenne: avancementDépartemental('annuel'),
      },
    },
    régionale: {
      global: {
        moyenne: avancementRégional('global'),
      },
      annuel: {
        moyenne: avancementRégional('annuel'),
      },
    },
  };
}
