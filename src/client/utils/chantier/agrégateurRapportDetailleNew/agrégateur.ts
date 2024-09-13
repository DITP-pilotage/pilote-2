import { objectEntries } from '@/client/utils/objects/objects';
import {
  calculerMoyenne,
  calculerMédiane,
  valeurMaximum,
  valeurMinimum,
} from '@/client/utils/statistiques/statistiques';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import départements from '@/client/constants/départements.json';
import régions from '@/client/constants/régions.json';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { ChantierRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';
import { AgrégatParTerritoire } from './agrégateur.interface';

type AvancementRegroupementDonnéesBrutesMaille = {
  global: (number | null) [],
  annuel: (number | null) [],
};

type AvancementRegroupementDonnéesBrutesTerritoire = {
  global: number | null,
  annuel: number | null,
};

export class AgrégateurChantierRapportDetailleParTerritoire {
  private readonly agrégat: AgrégatParTerritoire;

  constructor(private chantier: (ChantierRapportDetailleContrat)) {
    this.chantier = chantier;
    this.agrégat = this._créerAgrégatInitial();
  }

  agréger() {
    this._répartirLesDonnéesBrutesPourChaqueTerritoire();
    this._calculerLesRépartitions('nationale');
    this._calculerLesRépartitions('départementale');
    this._calculerLesRépartitions('régionale');
    return this.agrégat;
  }

  private _répartirLesDonnéesBrutesPourChaqueTerritoire() {
    objectEntries(this.chantier.mailles['nationale']).forEach(([codeInsee, donnéesTerritoire]) => {
      this.agrégat['nationale'].territoires[codeInsee].donnéesBrutes.avancements = donnéesTerritoire.avancement;
    });
    objectEntries(this.chantier.mailles['départementale']).forEach(([codeInsee, donnéesTerritoire]) => {
      this.agrégat['départementale'].territoires[codeInsee].donnéesBrutes.avancements = donnéesTerritoire.avancement;
    });
    objectEntries(this.chantier.mailles['régionale']).forEach(([codeInsee, donnéesTerritoire]) => {
      this.agrégat['régionale'].territoires[codeInsee].donnéesBrutes.avancements = donnéesTerritoire.avancement;
    });
  }

  private _calculerLesRépartitions(maille: Maille) {
    let avancementsPourCetteMaille: AvancementRegroupementDonnéesBrutesMaille = {
      global: [],
      annuel: [],
    };
    objectEntries(this.agrégat[maille].territoires).forEach(([codeInsee, donnéesTerritoire]) => {
      let avancementsPourCeCodeInsee: AvancementRegroupementDonnéesBrutesTerritoire = {
        global: null,
        annuel: null,
      };
      avancementsPourCeCodeInsee.global = donnéesTerritoire.donnéesBrutes.avancements.global;
      avancementsPourCeCodeInsee.annuel = donnéesTerritoire.donnéesBrutes.avancements.annuel;
      avancementsPourCetteMaille.global = [...avancementsPourCetteMaille.global, avancementsPourCeCodeInsee.global];
      avancementsPourCetteMaille.annuel = [...avancementsPourCetteMaille.annuel, avancementsPourCeCodeInsee.annuel];

      this._calculerLaRépartitionDesAvancementsParTerritoire(maille, avancementsPourCeCodeInsee, codeInsee);
    });
  
    this._calculerLaRépartitionDesAvancementsParMaille(maille, avancementsPourCetteMaille);
  }

  private _calculerLaRépartitionDesAvancementsParTerritoire(maille: Maille, avancements: AvancementRegroupementDonnéesBrutesTerritoire, codeInsee: string) {
    this.agrégat[maille].territoires[codeInsee].répartition.avancements.global = avancements.global;
    this.agrégat[maille].territoires[codeInsee].répartition.avancements.annuel = avancements.annuel;
  }

  private _calculerLaRépartitionDesAvancementsParMaille(maille: Maille, avancements: AvancementRegroupementDonnéesBrutesMaille) {
    this.agrégat[maille].répartition.avancements.global.minimum = valeurMinimum(avancements.global);
    this.agrégat[maille].répartition.avancements.global.maximum = valeurMaximum(avancements.global);
    this.agrégat[maille].répartition.avancements.global.moyenne = calculerMoyenne(avancements.global);
    this.agrégat[maille].répartition.avancements.global.médiane = calculerMédiane(avancements.global);

    this.agrégat[maille].répartition.avancements.annuel.moyenne = calculerMoyenne(avancements.annuel);

  }

  private _créerDonnéesInitialesPourUnTerritoire() {
    return {
      répartition: {
        avancements: {
          global: null,
          annuel: null,
        },
      },
      donnéesBrutes: {
        avancements: {
          global: null,
          annuel: null,
        },
      },
    };
  }

  private _créerDonnéesInitialesPourUneMaille(listeDeCodeInsee: CodeInsee[]) {
    return {
      répartition: {
        avancements: {
          global: {
            moyenne: null,
            médiane: null,
            minimum: null,
            maximum: null,
          },
          annuel: {
            moyenne: null,
          },
        },
      },
      territoires: Object.fromEntries(
        listeDeCodeInsee.map(codeInsee => (
          [
            codeInsee,
            this._créerDonnéesInitialesPourUnTerritoire(),
          ]
        )),
      ),
    };
  }

  private _créerAgrégatInitial(): AgrégatParTerritoire {
    return {
      nationale: this._créerDonnéesInitialesPourUneMaille(['FR']),
      départementale: this._créerDonnéesInitialesPourUneMaille(départements.map(département => département.codeInsee)),
      régionale: this._créerDonnéesInitialesPourUneMaille(régions.map(région => région.codeInsee)),
    };
  }
}
