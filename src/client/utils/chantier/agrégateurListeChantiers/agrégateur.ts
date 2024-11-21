import { objectEntries } from '@/client/utils/objects/objects';
import {
  calculerMoyenne,
  calculerMédiane,
  valeurMaximum,
  valeurMinimum,
} from '@/client/utils/statistiques/statistiques';
import départements from '@/client/constants/départements.json';
import régions from '@/client/constants/régions.json';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { ChantierAccueilContrat } from '@/server/chantiers/app/contrats/ChantierAccueilContratNew';
import { ChantierRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';
import { AgrégatParTerritoire } from './agrégateur.interface';

type AvancementRegroupementDonnéesBrutes = {
  global: (number | null) [],
  annuel: (number | null) [],
};

export class AgrégateurListeChantiersParTerritoire {
  private readonly agrégat: AgrégatParTerritoire;

  constructor(private chantiers: (ChantierAccueilContrat | ChantierRapportDetailleContrat)[]) {
    this.chantiers = chantiers;
    this.agrégat = this._créerAgrégatInitial();
  }

  agréger() {
    this._répartirLesDonnéesBrutesPourChaqueTerritoire();
    this._calculerLesRépartitions('nationale');
    this._calculerLesRépartitions('departementale');
    this._calculerLesRépartitions('regionale');
    return this.agrégat;
  }

  private _répartirLesDonnéesBrutesPourChaqueTerritoire() {
    this.chantiers.forEach(chantier => {
      objectEntries(chantier.mailles['nationale']).forEach(([territoireCode, donnéesTerritoire]) => {
        if (donnéesTerritoire.estApplicable) {
          this.agrégat['nationale'].territoires[territoireCode].donnéesBrutes.avancements = [...this.agrégat['nationale'].territoires[territoireCode].donnéesBrutes.avancements, donnéesTerritoire.avancement];
        }
      });
      objectEntries(chantier.mailles['departementale']).forEach(([territoireCode, donnéesTerritoire]) => {
        if (donnéesTerritoire.estApplicable) {
          this.agrégat['departementale'].territoires[territoireCode].donnéesBrutes.avancements = [...this.agrégat['departementale'].territoires[territoireCode].donnéesBrutes.avancements, donnéesTerritoire.avancement];
        }
      });
      objectEntries(chantier.mailles['regionale']).forEach(([territoireCode, donnéesTerritoire]) => {
        if (donnéesTerritoire.estApplicable) {
          this.agrégat['regionale'].territoires[territoireCode].donnéesBrutes.avancements = [...this.agrégat['regionale'].territoires[territoireCode].donnéesBrutes.avancements, donnéesTerritoire.avancement];
        }
      });
    });
  }

  private _calculerLesRépartitions(maille: Maille) {
    let avancementsPourCetteMaille: AvancementRegroupementDonnéesBrutes = {
      global: [],
      annuel: [],
    };
    objectEntries(this.agrégat[maille].territoires).forEach(([territoireCode, donnéesTerritoire]) => {
      let avancementsPourCeTerritoireCode: AvancementRegroupementDonnéesBrutes = {
        global: [],
        annuel: [],
      };
      avancementsPourCeTerritoireCode.global = donnéesTerritoire.donnéesBrutes.avancements.map(avancement => avancement.global);
      avancementsPourCeTerritoireCode.annuel = donnéesTerritoire.donnéesBrutes.avancements.map(avancement => avancement.annuel);
      avancementsPourCetteMaille.global = [...avancementsPourCetteMaille.global, ...avancementsPourCeTerritoireCode.global];
      avancementsPourCetteMaille.annuel = [...avancementsPourCetteMaille.annuel, ...avancementsPourCeTerritoireCode.annuel];

      this._calculerLaRépartitionDesAvancementsParTerritoire(maille, avancementsPourCeTerritoireCode, territoireCode);
    });
  
    this._calculerLaRépartitionDesAvancementsParMaille(maille, avancementsPourCetteMaille);
  }

  private _calculerLaRépartitionDesAvancementsParTerritoire(maille: Maille, avancements: AvancementRegroupementDonnéesBrutes, territoireCode: string) {
    this.agrégat[maille].territoires[territoireCode].répartition.avancements.global.minimum = valeurMinimum(avancements.global);
    this.agrégat[maille].territoires[territoireCode].répartition.avancements.global.maximum = valeurMaximum(avancements.global);
    this.agrégat[maille].territoires[territoireCode].répartition.avancements.global.moyenne = calculerMoyenne(avancements.global);
    this.agrégat[maille].territoires[territoireCode].répartition.avancements.global.médiane = calculerMédiane(avancements.global);

    this.agrégat[maille].territoires[territoireCode].répartition.avancements.annuel.moyenne = calculerMoyenne(avancements.annuel);
  }

  private _calculerLaRépartitionDesAvancementsParMaille(maille: Maille, avancements: AvancementRegroupementDonnéesBrutes) {
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
      donnéesBrutes: {
        avancements: [],
      },
    };
  }

  private _créerDonnéesInitialesPourUneMaille(listeDeTerritoireCode: string[]) {
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
        listeDeTerritoireCode.map(territoireCode => (
          [
            territoireCode,
            this._créerDonnéesInitialesPourUnTerritoire(),
          ]
        )),
      ),
    };
  }

  private _créerAgrégatInitial(): AgrégatParTerritoire {
    return {
      nationale: this._créerDonnéesInitialesPourUneMaille(['NAT-FR']),
      departementale: this._créerDonnéesInitialesPourUneMaille(départements.map(département => département.territoireCode)),
      regionale: this._créerDonnéesInitialesPourUneMaille(régions.map(région => région.territoireCode)),
    };
  }
}
