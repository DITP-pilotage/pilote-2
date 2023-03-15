import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import IndicateurBuilder from '@/server/domain/indicateur/Indicateur.builder';
import DétailsIndicateurBuilder from '@/server/domain/indicateur/DétailsIndicateur.builder';
import { codeInseeFrance, codesInseeDépartements, codesInseeRégions, CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export default class IndicateurRandomRepository implements IndicateurRepository {
  private _indicateurs: Indicateur[];

  constructor() {
    this._indicateurs = Array.from({ length: 3 }).map(() => new IndicateurBuilder().build());
  }

  async récupérerParChantierId(_chantierId: string): Promise<Indicateur[]> {
    return this._indicateurs;
  }

  async récupérerDétails(indicateurId: string, maille: Maille): Promise<DétailsIndicateurs> {
    let codesInsee: readonly CodeInsee[];

    if (maille === 'départementale')
      codesInsee = codesInseeDépartements;
    else if (maille === 'régionale')
      codesInsee = codesInseeRégions;
    else
      codesInsee = [codeInseeFrance];

    return {
      [indicateurId]: this._générerDétailsIndicateurParTerritoire(codesInsee),
    };
  }

  async récupererDétailsParChantierIdEtTerritoire(_chantierId: string, _maille: Maille, codesInsee: string[]): Promise<DétailsIndicateurs> {
    let détailsIndicateurs: DétailsIndicateurs = {};
    
    this._indicateurs.forEach(indicateur => {
      détailsIndicateurs = {
        ...détailsIndicateurs,
        [indicateur.id]: this._générerDétailsIndicateurParTerritoire(codesInsee),
      };
    });

    return détailsIndicateurs;
  }

  private _générerDétailsIndicateurParTerritoire(codesInsee: readonly CodeInsee[]) {
    let détailsIndicateurParTerritoire = {};

    codesInsee.forEach(codeInsee => { 
      détailsIndicateurParTerritoire = {
        ...détailsIndicateurParTerritoire, 
        [codeInsee]: new DétailsIndicateurBuilder().avecCodeInsee(codeInsee).build(),
      };
    });

    return détailsIndicateurParTerritoire;
  }
}
