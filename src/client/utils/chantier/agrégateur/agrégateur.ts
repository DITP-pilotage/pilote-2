import { objectEntries } from '@/client/utils/objects/objects';
import { valeurMinimum, valeurMaximum, calculerMoyenne, calculerMédiane } from '@/client/utils/statistiques/statistiques';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import départements from '@/client/constants/départements.json';
import régions from '@/client/constants/régions.json';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { AgrégatParTerritoire } from './agrégateur.interface';

type AvancementRegroupementDonnéesBrutes = {
  global: (number | null) [],
  annuel: (number | null) [],
};

export class AgrégateurChantiersParTerritoire {
  private agrégat: AgrégatParTerritoire = this._créerAgrégatInitial();

  constructor(private chantiers: Chantier[]) {
    this.chantiers = chantiers;
  }

  agréger() {
    this._répartirLesDonnéesBrutesPourChaqueTerritoire();
    this._calculerLesRépartitions();
    return this.agrégat;
  }

  private _répartirLesDonnéesBrutesPourChaqueTerritoire() {
    this.chantiers.forEach(chantier => {
      objectEntries(chantier.mailles).forEach(([maille, codesInsee]) => {
        objectEntries(codesInsee).forEach(([codeInsee, donnéesTerritoire]) => {
          this.agrégat[maille].territoires[codeInsee].donnéesBrutes.avancements = [...this.agrégat[maille].territoires[codeInsee].donnéesBrutes.avancements, donnéesTerritoire.avancement];
          this.agrégat[maille].territoires[codeInsee].donnéesBrutes.météos = [...this.agrégat[maille].territoires[codeInsee].donnéesBrutes.météos, donnéesTerritoire.météo];
        });
      });
    });
  }

  private _calculerLesRépartitions() {
    objectEntries(this.agrégat).forEach(([maille, codesInsee]) => {
      let avancementsPourCetteMaille: AvancementRegroupementDonnéesBrutes = {
        global: [],
        annuel: [],
      };


      objectEntries(codesInsee.territoires).forEach(([codeInsee, donnéesTerritoire]) => {
        const avancementsGlobaux = donnéesTerritoire.donnéesBrutes.avancements.map(avancement => avancement.global);
        const avancementsAnnuels = donnéesTerritoire.donnéesBrutes.avancements.map(avancement => avancement.annuel);
        avancementsPourCetteMaille.global = [...avancementsPourCetteMaille.global, ...avancementsGlobaux];
        avancementsPourCetteMaille.annuel = [...avancementsPourCetteMaille.annuel, ...avancementsAnnuels];


        this._calculerLaRépartitionDesMétéosParTerritoire(maille, codeInsee, donnéesTerritoire.donnéesBrutes.météos);
        this._calculerLaRépartitionDesAvancementsParTerritoire(maille, avancementsPourCetteMaille, codeInsee);
      });
  
      this._calculerLaRépartitionDesAvancementsParMaille(maille, avancementsPourCetteMaille);
    });
  }

  private _calculerLaRépartitionDesMétéosParTerritoire(maille: Maille, codeInsee: CodeInsee, météos: Météo[]) {
    météos.forEach(météo => {
      this.agrégat[maille].territoires[codeInsee].répartition.météos[météo] += 1;
    });
  }

  private _calculerLaRépartitionDesAvancementsParTerritoire(maille: Maille, avancements: AvancementRegroupementDonnéesBrutes, codeInsee: string | number) {

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
