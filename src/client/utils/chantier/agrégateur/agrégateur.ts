import Chantier, { Maille } from '@/server/domain/chantier/Chantier.interface';
import { objectEntries } from '@/client/utils/objects/objects';
import { valeurMinimum, valeurMaximum, calculerMoyenne, calculerMédiane } from '@/client/utils/statistiques/statistiques';
import Météo from '@/server/domain/chantier/Météo.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import départements from '@/client/constants/départements.json';
import régions from '@/client/constants/régions.json';
import { AgrégatParTerritoire } from './agrégateur.interface';

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
      let avancementsPourCetteMaille: (number | null)[] = [];
     
      objectEntries(codesInsee.territoires).forEach(([codeInsee, donnéesTerritoire]) => {
        const avancements = donnéesTerritoire.donnéesBrutes.avancements.map(avancement => avancement.global);
        avancementsPourCetteMaille = [...avancementsPourCetteMaille, ...avancements];
  
        this._calculerLaRépartitionDesMétéosParTerritoire(maille, codeInsee, donnéesTerritoire.donnéesBrutes.météos);
        this._calculerLaRépartitionDesAvancementsParTerritoire(maille, avancements, codeInsee);
      });
  
      this._calculerLaRépartitionDesAvancementsParMaille(maille, avancementsPourCetteMaille);
    });
  }

  private _calculerLaRépartitionDesMétéosParTerritoire(maille: Maille, codeInsee: string | number, météos: Météo[]) {
    météos.forEach(météo => {
      this.agrégat[maille].territoires[codeInsee].répartition.météos[météo] += 1;
    });
  }

  private _calculerLaRépartitionDesAvancementsParTerritoire(maille: Maille, avancements: (number | null)[], codeInsee: string | number) {
    this.agrégat[maille].territoires[codeInsee].répartition.avancements.minimum = valeurMinimum(avancements);
    this.agrégat[maille].territoires[codeInsee].répartition.avancements.maximum = valeurMaximum(avancements);
    this.agrégat[maille].territoires[codeInsee].répartition.avancements.moyenne = calculerMoyenne(avancements);
    this.agrégat[maille].territoires[codeInsee].répartition.avancements.médiane = calculerMédiane(avancements);
  }

  private _calculerLaRépartitionDesAvancementsParMaille(maille: Maille, avancements: (number | null)[]) {
    this.agrégat[maille].répartition.avancements.minimum = valeurMinimum(avancements);
    this.agrégat[maille].répartition.avancements.maximum = valeurMaximum(avancements);
    this.agrégat[maille].répartition.avancements.moyenne = calculerMoyenne(avancements);
    this.agrégat[maille].répartition.avancements.médiane = calculerMédiane(avancements);
  }

  private _créerDonnéesInitialesPourUnTerritoire() {
    return {
      répartition: {
        avancements: {
          moyenne: null,
          médiane: null,
          minimum: null,
          maximum: null,
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
          moyenne: null,
          médiane: null,
          minimum: null,
          maximum: null,
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
