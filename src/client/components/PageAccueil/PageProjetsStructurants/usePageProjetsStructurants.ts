import { mailleSélectionnéeTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { calculerMoyenne } from '@/client/utils/statistiques/statistiques';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import { codesInseeDépartements, codesInseeRégions } from '@/server/domain/territoire/Territoire.interface';
import { actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';

export default function usePageProjetsStructurants(projetsStructurants: ProjetStructurant[]) {
  const { récupérerNombreFiltresActifs } = actionsFiltresStore();
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();

  const avancementsGlobauxTerritoriauxMoyens = () => {
    const codesInsee = mailleSélectionnée === 'départementale' ? codesInseeDépartements : codesInseeRégions;    
    return codesInsee.map(codeInsee => {
      const projetsDuTerritoire = projetsStructurants.filter(projetStructurant => projetStructurant.maille === mailleSélectionnée && projetStructurant.codeInsee === codeInsee);
      const avancementMoyen = calculerMoyenne(projetsDuTerritoire.map(projet => projet.tauxAvancement));
      return { valeur: avancementMoyen, codeInsee: codeInsee };
    });
  }; 

  return { 
    nombreFiltresActifs: récupérerNombreFiltresActifs(),
    donnéesCartographie: avancementsGlobauxTerritoriauxMoyens(),
  };
}
