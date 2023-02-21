import { useMemo } from 'react';
import { AgrégateurChantiersParTerritoire } from '@/client/utils/chantier/agrégateur/agrégateur';
import { mailleSélectionnéeTerritoiresStore, territoireSélectionnéTerritoiresStore, mailleAssociéeAuTerritoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import Chantier from '@/server/domain/chantier/Chantier.interface';

export default function usePageChantier(chantier: Chantier) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const mailleAssociéeAuTerritoireSélectionné = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();

  const donnéesTerritoiresAgrégées = useMemo(() => {
    return new AgrégateurChantiersParTerritoire([chantier]).agréger();
  }, [chantier]);
    
  const avancementRégional = () => {
    if (mailleAssociéeAuTerritoireSélectionné === 'régionale')
      return donnéesTerritoiresAgrégées.régionale.territoires[territoireSélectionné.codeInsee].répartition.avancements.moyenne;
    
    if (mailleAssociéeAuTerritoireSélectionné === 'départementale' && territoireSélectionné.codeInseeParent) 
      return donnéesTerritoiresAgrégées.régionale.territoires[territoireSélectionné.codeInseeParent].répartition.avancements.moyenne;
  };

  const avancementDépartemental = () => {
    if (mailleAssociéeAuTerritoireSélectionné === 'départementale')
      return donnéesTerritoiresAgrégées[mailleSélectionnée].territoires[territoireSélectionné.codeInsee].répartition.avancements.moyenne;
  };

  const avancements = {
    nationale: {
      moyenne: donnéesTerritoiresAgrégées.nationale.répartition.avancements.moyenne,
      médiane: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.médiane,
      minimum: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.minimum,
      maximum: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.maximum,
    },
    départementale: {
      moyenne: avancementDépartemental(),
    },
    régionale: {
      moyenne: avancementRégional(),
    },
  };

  return { avancements };
}
