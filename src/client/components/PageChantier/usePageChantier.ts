import { useMemo } from 'react';
import { AgrégateurChantiersParTerritoire } from '@/client/utils/chantier/agrégateur/agrégateur';
import { mailleSélectionnéeTerritoiresStore, territoireSélectionnéTerritoiresStore, mailleAssociéeAuTerritoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import Indicateur, { IndicateursMétriques } from '@/server/domain/indicateur/Indicateur.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export default function usePageChantier(chantier: Chantier, indicateurs: Indicateur[]) {
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

  const indicateursMétriques = useMemo(() =>{
    //CALL API
    let results: Record<CodeInsee, IndicateursMétriques> = {};
    indicateurs.forEach(indicateur => {
      results[indicateur.id] = {
        'FR': {
          valeurInitiale: 0,
          dateValeurInitiale: '10/10/2021',
          valeurActuelle: 56,
          dateValeurActuelle: '16/10/2022',
          valeurCible: 100,
          avancement: {
            global: 56,
            annuel: null,
          },
        },
        '02': {
          valeurInitiale: 123,
          dateValeurInitiale: '10/01/2022',
          valeurActuelle: 500,
          dateValeurActuelle: '10/10/2022',
          valeurCible: 1000,
          avancement: {
            global: 43,
            annuel: null,
          },
        },
        '03': {
          valeurInitiale: 800,
          dateValeurInitiale: '09/06/2021',
          valeurActuelle: 980,
          dateValeurActuelle: '10/10/2022',
          valeurCible: 1000,
          avancement: {
            global: 78,
            annuel: null,
          },
        },
      };
    });
    return results;
  }, [indicateurs]);

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

  return { avancements, indicateursMétriques };
}
