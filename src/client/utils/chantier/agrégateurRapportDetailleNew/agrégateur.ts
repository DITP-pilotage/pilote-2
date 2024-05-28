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
import { Météo } from '@/server/domain/météo/Météo.interface';
import { ChantierAccueilContrat } from '@/server/chantiers/app/contrats/ChantierAccueilContrat';
import { ChantierRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';
import { AgrégatParTerritoire } from './agrégateur.interface';

type AvancementRegroupementDonnéesBrutes = {
  global: (number | null) [],
  annuel: (number | null) [],
};

export class AgrégateurChantierRapportDetailleParTerritoire {
  private readonly agrégat: AgrégatParTerritoire;

  constructor(private chantier: (ChantierAccueilContrat | ChantierRapportDetailleContrat)) {
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
      this.agrégat['nationale'].territoires[codeInsee].donnéesBrutes.avancements = [...this.agrégat['nationale'].territoires[codeInsee].donnéesBrutes.avancements, donnéesTerritoire.avancement];
      this.agrégat['nationale'].territoires[codeInsee].donnéesBrutes.météos = [...this.agrégat['nationale'].territoires[codeInsee].donnéesBrutes.météos, donnéesTerritoire.météo];
    });
    objectEntries(this.chantier.mailles['départementale']).forEach(([codeInsee, donnéesTerritoire]) => {
      this.agrégat['départementale'].territoires[codeInsee].donnéesBrutes.avancements = [...this.agrégat['départementale'].territoires[codeInsee].donnéesBrutes.avancements, donnéesTerritoire.avancement];
      this.agrégat['départementale'].territoires[codeInsee].donnéesBrutes.météos = [...this.agrégat['départementale'].territoires[codeInsee].donnéesBrutes.météos, donnéesTerritoire.météo];
    });
    objectEntries(this.chantier.mailles['régionale']).forEach(([codeInsee, donnéesTerritoire]) => {
      this.agrégat['régionale'].territoires[codeInsee].donnéesBrutes.avancements = [...this.agrégat['régionale'].territoires[codeInsee].donnéesBrutes.avancements, donnéesTerritoire.avancement];
      this.agrégat['régionale'].territoires[codeInsee].donnéesBrutes.météos = [...this.agrégat['régionale'].territoires[codeInsee].donnéesBrutes.météos, donnéesTerritoire.météo];
    });
  }

  private _calculerLesRépartitions(maille: Maille) {
    let avancementsPourCetteMaille: AvancementRegroupementDonnéesBrutes = {
      global: [],
      annuel: [],
    };
    objectEntries(this.agrégat[maille].territoires).forEach(([codeInsee, donnéesTerritoire]) => {
      let avancementsPourCeCodeInsee: AvancementRegroupementDonnéesBrutes = {
        global: [],
        annuel: [],
      };
      avancementsPourCeCodeInsee.global = donnéesTerritoire.donnéesBrutes.avancements.map(avancement => avancement.global);
      avancementsPourCeCodeInsee.annuel = donnéesTerritoire.donnéesBrutes.avancements.map(avancement => avancement.annuel);
      avancementsPourCetteMaille.global = [...avancementsPourCetteMaille.global, ...avancementsPourCeCodeInsee.global];
      avancementsPourCetteMaille.annuel = [...avancementsPourCetteMaille.annuel, ...avancementsPourCeCodeInsee.annuel];
        
      this._calculerLaRépartitionDesMétéosParTerritoire(maille, codeInsee, donnéesTerritoire.donnéesBrutes.météos);
      this._calculerLaRépartitionDesAvancementsParTerritoire(maille, avancementsPourCeCodeInsee, codeInsee);
    });
  
    this._calculerLaRépartitionDesAvancementsParMaille(maille, avancementsPourCetteMaille);
  }

  private _calculerLaRépartitionDesMétéosParTerritoire(maille: Maille, codeInsee: CodeInsee, météos: Météo[]) {
    météos.forEach(météo => {
      this.agrégat[maille].territoires[codeInsee].répartition.météos[météo] += 1;
    });
  }

  private _calculerLaRépartitionDesAvancementsParTerritoire(maille: Maille, avancements: AvancementRegroupementDonnéesBrutes, codeInsee: string) {
    this.agrégat[maille].territoires[codeInsee].répartition.avancements.global.minimum = valeurMinimum(avancements.global);
    this.agrégat[maille].territoires[codeInsee].répartition.avancements.global.maximum = valeurMaximum(avancements.global);
    this.agrégat[maille].territoires[codeInsee].répartition.avancements.global.moyenne = calculerMoyenne(avancements.global);
    this.agrégat[maille].territoires[codeInsee].répartition.avancements.global.médiane = calculerMédiane(avancements.global);

    this.agrégat[maille].territoires[codeInsee].répartition.avancements.annuel.moyenne = calculerMoyenne(avancements.annuel);

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
        météos: {
          'NON_RENSEIGNEE': 0,
          'ORAGE': 0,
          'COUVERT': 0,
          'NUAGE': 0,
          'SOLEIL': 0,
          'NON_NECESSAIRE': 0,
        },
      },
      donnéesBrutes: {
        avancements: [],
        météos: [],
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
