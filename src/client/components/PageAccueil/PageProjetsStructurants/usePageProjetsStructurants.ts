import { useCallback, useMemo } from 'react';
import { actionsTerritoiresStore, mailleSélectionnéeTerritoiresStore, territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { calculerMoyenne } from '@/client/utils/statistiques/statistiques';
import { CartographieDonnéesAvancement } from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement.interface';
import { météos } from '@/server/domain/météo/Météo.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import { CodeInsee, codesInseeDépartements, codesInseeRégions } from '@/server/domain/territoire/Territoire.interface';
import { actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';
import { RépartitionMétéos } from '@/components/_commons/RépartitionMétéo/RépartitionMétéo.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';

export default function usePageProjetsStructurants(projetsStructurants: ProjetStructurant[]) {
  const { récupérerNombreFiltresActifs } = actionsFiltresStore();
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const codeInseeTerritoireSélectionné = territoireSélectionnéTerritoiresStore()!.codeInsee;
  const { récupérerDépartementsAssociésÀLaRégion } = actionsTerritoiresStore();

  const projetsDuTerritoire = useCallback((codeInsee: CodeInsee, maille: MailleInterne) => {
    return codeInsee === 'FR' 
      ? projetsStructurants
      : projetsStructurants.filter(projet => projet.maille === maille && projet.codeInsee === codeInsee);
  }, [projetsStructurants]);

  const projetsDuTerritoireEtTerritoiresEnfants = useCallback((codeInsee: CodeInsee, maille: MailleInterne) => {    
    return maille === 'départementale' 
      ? projetsDuTerritoire(codeInsee, maille)
      : [
        ...projetsDuTerritoire(codeInsee, maille),
        ...projetsStructurants.filter(projet => projet.maille === 'départementale' && récupérerDépartementsAssociésÀLaRégion(codeInsee, maille).includes(projet.codeInsee)),
      ];
  }, [projetsDuTerritoire, projetsStructurants, récupérerDépartementsAssociésÀLaRégion]);
  
  const avancementMoyenDuTerritoireSélectionné = (): number | null => {
    return calculerMoyenne(projetsDuTerritoireEtTerritoiresEnfants(codeInseeTerritoireSélectionné, mailleSélectionnée).map(projet => projet.avancement));
  };
  
  const avancementsMoyensTerritoiresMailleSélectionnée = useMemo((): CartographieDonnéesAvancement => {
    const codesInsee = mailleSélectionnée === 'départementale' ? codesInseeDépartements : codesInseeRégions;
    return codesInsee.map(codeInsee => {
      const projets = projetsDuTerritoireEtTerritoiresEnfants(codeInsee, mailleSélectionnée);
      const avancementMoyen = calculerMoyenne(projets.map(projet => projet.avancement));
      return { valeur: avancementMoyen, codeInsee: codeInsee };
    });
  }, [mailleSélectionnée, projetsDuTerritoireEtTerritoiresEnfants]);

  const répartitionMétéosTerritoireSélectionné = (): RépartitionMétéos => {
    return Object.fromEntries(
      météos.map(météo => 
        [météo, (projetsDuTerritoireEtTerritoiresEnfants(codeInseeTerritoireSélectionné, mailleSélectionnée).filter(projet => projet.météo === météo)).length]),
    ) as RépartitionMétéos;
  };

  return {
    projetsDuTerritoireSélectionnéEtTerritoiresEnfants: projetsDuTerritoireEtTerritoiresEnfants(codeInseeTerritoireSélectionné, mailleSélectionnée),
    nombreFiltresActifs: récupérerNombreFiltresActifs(),
    donnéesCartographieAvancement: avancementsMoyensTerritoiresMailleSélectionnée,
    donnéesAvancementMoyen: avancementMoyenDuTerritoireSélectionné(),
    répartitionMétéos: répartitionMétéosTerritoireSélectionné(),
  };
}
