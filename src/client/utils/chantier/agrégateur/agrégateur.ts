import { objectEntries } from "@/client/utils/objects/objects";
import {
  calculerMoyenne,
  calculerMédiane,
  valeurMaximum,
  valeurMinimum,
} from "@/client/utils/statistiques/statistiques";
import { CodeInsee } from "@/server/domain/territoire/Territoire.interface";
import départements from "@/client/constants/départements.json";
import régions from "@/client/constants/régions.json";
import { Maille } from "@/server/domain/maille/Maille.interface";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import { AgrégatParTerritoire } from "./agrégateur.interface";

type AvancementRegroupementDonnéesBrutesMaille = {
  global: (number | null)[];
  annuel: (number | null)[];
};

type AvancementRegroupementDonnéesBrutesTerritoire = {
  global: { avancement: number | null; date: string | null };
  annuel: { avancement: number | null; date: string | null };
};

export class AgrégateurChantiersParTerritoire {
  private agrégat: AgrégatParTerritoire;

  constructor(private chantier: Chantier) {
    this.chantier = chantier;
    this.agrégat = this._créerAgrégatInitial();
  }

  agréger() {
    this._répartirLesDonnéesBrutesPourChaqueTerritoire();
    this._calculerLesRépartitions();
    return this.agrégat;
  }

  private _répartirLesDonnéesBrutesPourChaqueTerritoire() {
    objectEntries(this.chantier.mailles).forEach(
      ([maille, territoiresCode]) => {
        objectEntries(territoiresCode).forEach(
          ([territoireCode, donnéesTerritoire]) => {
            this.agrégat[maille].territoires[
              territoireCode
            ].donnéesBrutes.avancements = {
              global: {
                avancement: donnéesTerritoire.avancement.global,
                date: donnéesTerritoire.dateDeMàjDonnéesQuantitatives,
              },
              annuel: {
                avancement: donnéesTerritoire.avancement.annuel,
                date: donnéesTerritoire.dateTauxAvancementAnnuel,
              },
            };
          },
        );
      },
    );
  }

  private _calculerLesRépartitions() {
    objectEntries(this.agrégat).forEach(([maille, territoiresCodes]) => {
      let avancementsPourCetteMaille: AvancementRegroupementDonnéesBrutesMaille =
        {
          global: [],
          annuel: [],
        };
      objectEntries(territoiresCodes.territoires).forEach(
        ([territoireCode, donnéesTerritoire]) => {
          let avancementsPourCeCodeInsee: AvancementRegroupementDonnéesBrutesTerritoire =
            {
              global: { avancement: null, date: null },
              annuel: { avancement: null, date: null },
            };
          avancementsPourCeCodeInsee.global =
            donnéesTerritoire.donnéesBrutes.avancements.global;
          avancementsPourCeCodeInsee.annuel =
            donnéesTerritoire.donnéesBrutes.avancements.annuel;
          avancementsPourCetteMaille.global = [
            ...avancementsPourCetteMaille.global,
            avancementsPourCeCodeInsee.global.avancement,
          ];
          avancementsPourCetteMaille.annuel = [
            ...avancementsPourCetteMaille.annuel,
            avancementsPourCeCodeInsee.annuel.avancement,
          ];

          this._calculerLaRépartitionDesAvancementsParTerritoire(
            maille,
            avancementsPourCeCodeInsee,
            territoireCode,
          );
        },
      );

      this._calculerLaRépartitionDesAvancementsParMaille(
        maille,
        avancementsPourCetteMaille,
      );
    });
  }

  private _calculerLaRépartitionDesAvancementsParTerritoire(
    maille: Maille,
    avancements: AvancementRegroupementDonnéesBrutesTerritoire,
    territoireCode: string,
  ) {
    this.agrégat[maille].territoires[
      territoireCode
    ].répartition.avancements.global = avancements.global;
    this.agrégat[maille].territoires[
      territoireCode
    ].répartition.avancements.annuel = avancements.annuel;
  }

  private _calculerLaRépartitionDesAvancementsParMaille(
    maille: Maille,
    avancements: AvancementRegroupementDonnéesBrutesMaille,
  ) {
    this.agrégat[maille].répartition.avancements.global.minimum = valeurMinimum(
      avancements.global,
    );
    this.agrégat[maille].répartition.avancements.global.maximum = valeurMaximum(
      avancements.global,
    );
    this.agrégat[maille].répartition.avancements.global.moyenne =
      calculerMoyenne(avancements.global);
    this.agrégat[maille].répartition.avancements.global.médiane =
      calculerMédiane(avancements.global);

    this.agrégat[maille].répartition.avancements.annuel.moyenne =
      calculerMoyenne(avancements.annuel);
  }

  private _créerDonnéesInitialesPourUnTerritoire() {
    return {
      répartition: {
        avancements: {
          global: { avancement: null, date: null },
          annuel: { avancement: null, date: null },
        },
      },
      donnéesBrutes: {
        avancements: {
          global: { avancement: null, date: null },
          annuel: { avancement: null, date: null },
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
        listeDeCodeInsee.map((territoireCode) => [
          territoireCode,
          this._créerDonnéesInitialesPourUnTerritoire(),
        ]),
      ),
    };
  }

  private _créerAgrégatInitial(): AgrégatParTerritoire {
    return {
      nationale: this._créerDonnéesInitialesPourUneMaille(["NAT-FR"]),
      departementale: this._créerDonnéesInitialesPourUneMaille(
        départements.map((département) => département.territoireCode),
      ),
      regionale: this._créerDonnéesInitialesPourUneMaille(
        régions.map((région) => région.territoireCode),
      ),
    };
  }
}
