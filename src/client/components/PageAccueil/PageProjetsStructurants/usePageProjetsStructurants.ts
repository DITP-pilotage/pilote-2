import { useCallback, useMemo } from 'react';
import { actionsTerritoiresStore, mailleSélectionnéeTerritoiresStore, territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { calculerMoyenne } from '@/client/utils/statistiques/statistiques';
import { CartographieDonnéesAvancement } from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement.interface';
import { météos } from '@/server/domain/météo/Météo.interface';
import {
  ProjetStructurantVueDEnsemble,
} from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import { CodeInsee, codesInseeDépartements, codesInseeRégions } from '@/server/domain/territoire/Territoire.interface';
import { actions as actionsFiltresStore, filtresActifs as filtresActifsStore } from '@/stores/useFiltresStore/useFiltresStore';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { RépartitionMétéos } from '@/components/_commons/RépartitionMétéo/RépartitionMétéo';

export default function usePageProjetsStructurants(projetsStructurants: ProjetStructurantVueDEnsemble[]) {
  const filtresActifs = filtresActifsStore();
  const { récupérerNombreFiltresActifs } = actionsFiltresStore();
  
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const codeInseeTerritoireSélectionné = territoireSélectionnéTerritoiresStore()!.codeInsee;
  const { récupérerCodesInseeDépartementsAssociésÀLaRégion } = actionsTerritoiresStore();
 
  const projetsStructurantsFiltrés = useMemo(() => {
    let résultat: ProjetStructurantVueDEnsemble[] = projetsStructurants;

    if (filtresActifs.périmètresMinistériels.length > 0) {
      résultat = résultat.filter(projet => (
        filtresActifs.périmètresMinistériels.some(filtre => (projet.périmètresIds[0] === filtre.id))
      ));
    }
    return résultat;
  }, [filtresActifs, projetsStructurants]);


  const projetsDuTerritoire = useCallback((codeInsee: CodeInsee, maille: MailleInterne) => {
    return codeInsee === 'FR' 
      ? projetsStructurantsFiltrés
      : projetsStructurantsFiltrés.filter(projet => projet.maille === maille && projet.codeInsee === codeInsee);
  }, [projetsStructurantsFiltrés]);

  const projetsDuTerritoireEtTerritoiresEnfants = useCallback((codeInsee: CodeInsee, maille: MailleInterne) => {    
    return maille === 'departementale'
      ? projetsDuTerritoire(codeInsee, maille)
      : [
        ...projetsDuTerritoire(codeInsee, maille),
        ...projetsStructurantsFiltrés.filter(projet => projet.maille === 'departementale' && récupérerCodesInseeDépartementsAssociésÀLaRégion(codeInsee, maille).includes(projet.codeInsee)),
      ];
  }, [projetsDuTerritoire, projetsStructurantsFiltrés, récupérerCodesInseeDépartementsAssociésÀLaRégion]);
  
  const avancementMoyenDuTerritoireSélectionné = (): number | null => {
    return calculerMoyenne(projetsDuTerritoireEtTerritoiresEnfants(codeInseeTerritoireSélectionné, mailleSélectionnée).map(projet => projet.avancement));
  };
  
  const avancementsMoyensTerritoiresMailleSélectionnée = useMemo((): CartographieDonnéesAvancement => {
    const listeTerritoireCode = mailleSélectionnée === 'departementale' ? codesInseeDépartements.map(code => `DEPT-${code}`) : codesInseeRégions.map(code => `REG-${code}`) ;
    return listeTerritoireCode.map(territoireCode => {
      const projets = projetsDuTerritoireEtTerritoiresEnfants(territoireCode, mailleSélectionnée);
      const avancementMoyen = calculerMoyenne(projets.map(projet => projet.avancement));
      return { valeur: avancementMoyen, valeurAnnuelle: null, territoireCode, estApplicable: null };
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
