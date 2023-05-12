import Chantier from '@/server/domain/chantier/Chantier.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { AgrégateurChantiersParTerritoire } from '@/client/utils/chantier/agrégateur/agrégateur';
import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';

export default function calculerChantierAvancements(
  chantier: Chantier,
  mailleSélectionnée: MailleInterne,
  territoireSélectionné: DétailTerritoire,
  territoireParent: DétailTerritoire | null,
) {
  
  const donnéesTerritoiresAgrégées = new AgrégateurChantiersParTerritoire([chantier]).agréger();

  const avancementRégional = () => {
    if (territoireSélectionné.maille === 'régionale')
      return donnéesTerritoiresAgrégées.régionale.territoires[territoireSélectionné.codeInsee].répartition.avancements.global.moyenne;

    if (territoireSélectionné.maille === 'départementale' && territoireParent)
      return donnéesTerritoiresAgrégées.régionale.territoires[territoireParent.codeInsee].répartition.avancements.global.moyenne;
  };

  const avancementDépartemental = () => {
    if (territoireSélectionné.maille === 'départementale')
      return donnéesTerritoiresAgrégées[mailleSélectionnée].territoires[territoireSélectionné.codeInsee].répartition.avancements.global.moyenne;
  };

  return {
    nationale: {
      global: {
        moyenne: donnéesTerritoiresAgrégées.nationale.répartition.avancements.global.moyenne,
        médiane: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.global.médiane,
        minimum: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.global.minimum,
        maximum: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.global.maximum,
      },
      annuel: {
        moyenne: donnéesTerritoiresAgrégées.nationale.répartition.avancements.annuel.moyenne,
      },
    },
    départementale: {
      moyenne: avancementDépartemental(),
    },
    régionale: {
      moyenne: avancementRégional(),
    },
  };
}
