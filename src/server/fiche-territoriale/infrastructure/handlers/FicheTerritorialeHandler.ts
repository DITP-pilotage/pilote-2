import { FicheTerritorialeContrat } from '@/server/fiche-territoriale/app/contrats/FicheTerritorialeContrat';
import { presenterEnTerritoireContrat } from '@/server/fiche-territoriale/app/contrats/TerritoireContrat';
import {
  RécupérerTerritoireParCodeUseCase,
} from '@/server/fiche-territoriale/usecases/RécupérerTerritoireParCodeUseCase';
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
import {
  RécupérerRépartitionMétéoUseCase,
} from '@/server/fiche-territoriale/usecases/RécupérerRépartitionMétéoUseCase';
import {
  RécupérerListeChantierFicheTerritorialeUseCase,
} from '@/server/fiche-territoriale/usecases/RécupérerListeChantierFicheTerritorialeUseCase';
import {
  presenterEnChantierFicheTerritorialeContrat,
} from '@/server/fiche-territoriale/app/contrats/ChantierFicheTerritorialeContrat';

interface Dependencies {
  recupererTerritoireParCodeUseCase: RécupérerTerritoireParCodeUseCase;
  recupererTauxAvancementGlobalTerritoireUseCase: RécupérerTauxAvancementGlobalTerritoireUseCase;
  recupererTauxAvancementAnnuelTerritoireUseCase: RécupérerTauxAvancementAnnuelTerritoireUseCase;
  recupererRépartitionMétéoUseCase: RécupérerRépartitionMétéoUseCase;
  recupererListeChantierFicheTerritorialeUseCase: RécupérerListeChantierFicheTerritorialeUseCase;
}

export class FicheTerritorialeHandler {
  private recupererTerritoireParCodeUseCase: RécupérerTerritoireParCodeUseCase;

  private recupererTauxAvancementGlobalTerritoireUseCase: RécupérerTauxAvancementGlobalTerritoireUseCase;

  private recupererTauxAvancementAnnuelTerritoireUseCase: RécupérerTauxAvancementAnnuelTerritoireUseCase;

  private recupererRépartitionMétéoUseCase: RécupérerRépartitionMétéoUseCase;

  private recupererListeChantierFicheTerritorialeUseCase: RécupérerListeChantierFicheTerritorialeUseCase;

  constructor({
    recupererTerritoireParCodeUseCase,
    recupererTauxAvancementGlobalTerritoireUseCase,
    recupererTauxAvancementAnnuelTerritoireUseCase,
    recupererRépartitionMétéoUseCase,
    recupererListeChantierFicheTerritorialeUseCase,
  }: Dependencies) {
    this.recupererTerritoireParCodeUseCase = recupererTerritoireParCodeUseCase;
    this.recupererTauxAvancementGlobalTerritoireUseCase = recupererTauxAvancementGlobalTerritoireUseCase;
    this.recupererTauxAvancementAnnuelTerritoireUseCase = recupererTauxAvancementAnnuelTerritoireUseCase;
    this.recupererRépartitionMétéoUseCase = recupererRépartitionMétéoUseCase;
    this.recupererListeChantierFicheTerritorialeUseCase = recupererListeChantierFicheTerritorialeUseCase;
  }

  async recupererFicheTerritoriale(territoireCode: string, jalon: number): Promise<FicheTerritorialeContrat> {
    const territoire = presenterEnTerritoireContrat(await this.recupererTerritoireParCodeUseCase.run({ territoireCode: territoireCode as string }));

    const avancementGlobalTerritoire = await this.recupererTauxAvancementGlobalTerritoireUseCase
      .run({ territoireCode, jalon })
      .then(presenterEnTauxAvancementGlobalTerritoireContrat);

    const avancementAnnuelTerritoire = await this.recupererTauxAvancementAnnuelTerritoireUseCase
      .run({ territoireCode, jalon })
      .then(presenterEnTauxAvancementAnnuelTerritoireContrat);

    const répartitionMétéos = await this.recupererRépartitionMétéoUseCase
      .run({ territoireCode, jalon })
      .then(presenterEnRépartitionsMétéosContrat);

    const chantiersFicheTerritoriale = await this.recupererListeChantierFicheTerritorialeUseCase
      .run({ territoireCode, jalon })
      .then(result => result.map(presenterEnChantierFicheTerritorialeContrat));

    return {
      territoire,
      avancementGlobalTerritoire,
      avancementAnnuelTerritoire,
      répartitionMétéos,
      chantiersFicheTerritoriale,
      jalon,
    };
  }
}
