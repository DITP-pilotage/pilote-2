import { mailleSélectionnéeTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { calculerMoyenne } from '@/client/utils/statistiques/statistiques';
import { CartographieDonnéesAvancement } from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import { CodeInsee, codesInseeDépartements, codesInseeRégions } from '@/server/domain/territoire/Territoire.interface';
import { actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';

export default function usePageProjetsStructurants(projetsStructurants: ProjetStructurant[]) {
  const { récupérerNombreFiltresActifs } = actionsFiltresStore();
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  
  const avancementsTerritoiresMoyensCartographie = (): CartographieDonnéesAvancement => {
    const codesInsee = mailleSélectionnée === 'départementale' ? codesInseeDépartements : codesInseeRégions;
    return codesInsee.map(codeInsee => {
      const projetsDuTerritoire = projetsStructurants.filter(projetStructurant => projetStructurant.maille === mailleSélectionnée && projetStructurant.codeInsee === codeInsee);
      const avancementMoyen = calculerMoyenne(projetsDuTerritoire.map(projet => projet.tauxAvancement));
      return { valeur: avancementMoyen, codeInsee: codeInsee };
    });
  };

  const avancementsTerritoiresMoyensAvecFrance = (): Record<CodeInsee, number | null> => { 
    const résultat = Object.fromEntries(
      avancementsTerritoiresMoyensCartographie().map(donnéeAvancement => 
        [donnéeAvancement.codeInsee, donnéeAvancement.valeur],
      ),
    );
    résultat.FR = calculerMoyenne(projetsStructurants.map(projet => projet.tauxAvancement));
    return résultat;
  };  

  return { 
    nombreFiltresActifs: récupérerNombreFiltresActifs(),
    donnéesCartographieAvancement: avancementsTerritoiresMoyensCartographie(),
    donnéesAvancementsMoyens: avancementsTerritoiresMoyensAvecFrance(),
  };
}
