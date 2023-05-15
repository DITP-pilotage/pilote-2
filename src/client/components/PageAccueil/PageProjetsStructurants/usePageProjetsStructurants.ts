import { mailleSélectionnéeTerritoiresStore, territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { calculerMoyenne } from '@/client/utils/statistiques/statistiques';
import { CartographieDonnéesAvancement } from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement.interface';
import { météos } from '@/server/domain/météo/Météo.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import { codesInseeDépartements, codesInseeRégions } from '@/server/domain/territoire/Territoire.interface';
import { actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';
import { RépartitionMétéos } from '@/client/components/PageAccueil/PageChantiers/RépartitionMétéo/RépartitionMétéo.interface';

export default function usePageProjetsStructurants(projetsStructurants: ProjetStructurant[]) {
  const { récupérerNombreFiltresActifs } = actionsFiltresStore();
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const codeInseeTerritoireSélectionné = territoireSélectionnéTerritoiresStore()?.codeInsee;

  const projetsDuTerritoireSélectionné = codeInseeTerritoireSélectionné === 'FR' 
    ? projetsStructurants
    : projetsStructurants.filter(projetStructurant => projetStructurant.maille === mailleSélectionnée && projetStructurant.codeInsee === codeInseeTerritoireSélectionné);
  
  const avancementMoyenTerritoireSélectionné = (): number | null => {
    return calculerMoyenne(projetsDuTerritoireSélectionné.map(projet => projet.tauxAvancement));
  };

  const avancementsMoyensTerritoiresMailleSélectionnée = (): CartographieDonnéesAvancement => {
    const codesInsee = mailleSélectionnée === 'départementale' ? codesInseeDépartements : codesInseeRégions;
    return codesInsee.map(codeInsee => {
      const projetsDuTerritoire = projetsStructurants.filter(projetStructurant => projetStructurant.maille === mailleSélectionnée && projetStructurant.codeInsee === codeInsee);
      const avancementMoyen = calculerMoyenne(projetsDuTerritoire.map(projet => projet.tauxAvancement));
      return { valeur: avancementMoyen, codeInsee: codeInsee };
    });
  };

  const répartitionMétéosTerritoireSélectionné = (): RépartitionMétéos => {
    return Object.fromEntries(
      météos.map(météo => 
        [météo, (projetsDuTerritoireSélectionné.filter(projet => projet.météo === météo)).length]),
    ) as RépartitionMétéos;
  };

  return { 
    nombreFiltresActifs: récupérerNombreFiltresActifs(),
    donnéesCartographieAvancement: avancementsMoyensTerritoiresMailleSélectionnée(),
    donnéesAvancementsMoyens: avancementMoyenTerritoireSélectionné(),
    répartitionMétéos: répartitionMétéosTerritoireSélectionné(),
  };
}
