import { FicheTerritorialeContrat } from '@/server/fiche-territoriale/app/contrats/FicheTerritorialeContrat';
import { presenterEnTerritoireContrat } from '@/server/fiche-territoriale/app/contrats/TerritoireContrat';
import {
  RécupérerTerritoireParCodeUseCase,
} from '@/server/fiche-territoriale/usecases/RécupérerTerritoireParCodeUseCase';
import { dependencies } from '@/server/infrastructure/Dependencies';
import {
  presenterEnTauxAvancementGlobalTerritoireContrat,
} from '@/server/fiche-territoriale/app/contrats/TauxAvancementGlobalTerritoireContrat';
import {
  RécupérerTauxAvancementGlobalTerritoireUseCase,
} from '@/server/fiche-territoriale/usecases/RécupérerTauxAvancementGlobalTerritoireUseCase';
import {
  presenterEnTauxAvancementAnnuelTerritoireContrat,
} from '@/server/fiche-territoriale/app/contrats/TauxAvancementAnnuelTerritoireContrat';
import {
  RécupérerTauxAvancementAnnuelTerritoireUseCase,
} from '@/server/fiche-territoriale/usecases/RécupérerTauxAvancementAnnuelTerritoireUseCase';
import { presenterEnRépartitionsMétéosContrat } from '@/server/fiche-territoriale/app/contrats/RepartitionMeteoContrat';
import { RécupérerRépartitionMétéoUseCase } from '@/server/fiche-territoriale/usecases/RécupérerRépartitionMétéoUseCase';
import {
  RécupérerListeChantierFicheTerritorialeUseCase,
} from '@/server/fiche-territoriale/usecases/RécupérerListeChantierFicheTerritorialeUseCase';
import {
  presenterEnChantierFicheTerritorialeContrat,
} from '@/server/fiche-territoriale/app/contrats/ChantierFicheTerritorialeContrat';

export const ficheTerritorialeHandler = () => {
  const recupererFicheTerritoriale = async (territoireCode: string): Promise<FicheTerritorialeContrat> => {
    const territoire = presenterEnTerritoireContrat(await new RécupérerTerritoireParCodeUseCase({ territoireRepository: dependencies.getFicheTerritorialeTerritoireRepository() }).run({ territoireCode: territoireCode as string }));

    const avancementGlobalTerritoire = presenterEnTauxAvancementGlobalTerritoireContrat(await new RécupérerTauxAvancementGlobalTerritoireUseCase({
      chantierRepository: dependencies.getFicheTerritorialeChantierRepository(),
      territoireRepository: dependencies.getFicheTerritorialeTerritoireRepository(),
    }).run({ territoireCode: territoireCode as string }));

    const avancementAnnuelTerritoire = presenterEnTauxAvancementAnnuelTerritoireContrat(await new RécupérerTauxAvancementAnnuelTerritoireUseCase({
      chantierRepository: dependencies.getFicheTerritorialeChantierRepository(),
      territoireRepository: dependencies.getFicheTerritorialeTerritoireRepository(),
    }).run({ territoireCode: territoireCode as string }));

    const répartitionMétéos = presenterEnRépartitionsMétéosContrat(await new RécupérerRépartitionMétéoUseCase({
      chantierRepository: dependencies.getFicheTerritorialeChantierRepository(),
      territoireRepository: dependencies.getFicheTerritorialeTerritoireRepository(),
    }).run({ territoireCode: territoireCode as string }));

    const chantiersFicheTerritoriale = await new RécupérerListeChantierFicheTerritorialeUseCase({
      chantierRepository: dependencies.getFicheTerritorialeChantierRepository(),
      territoireRepository: dependencies.getFicheTerritorialeTerritoireRepository(),
      syntheseDesResultatsRepository: dependencies.getFicheTerritorialeSyntheseDesResultatsRepository(),
      indicateurRepository: dependencies.getFicheTerritorialeIndicateurRepository(),
      ministereRepository: dependencies.getFicheTerritorialeMinistereRepository(),
    }).run({ territoireCode: territoireCode as string })
      .then(result => result.map(presenterEnChantierFicheTerritorialeContrat));

    return {
      territoire,
      avancementGlobalTerritoire,
      avancementAnnuelTerritoire,
      répartitionMétéos,
      chantiersFicheTerritoriale,
    };
  };

  return {
    recupererFicheTerritoriale,
  };
};
