import { objectEntries } from "@/client/utils/objects/objects";
import {
  calculerMoyenne,
  calculerMediane,
  valeurMaximum,
  valeurMinimum,
} from "@/client/utils/statistiques/statistiques";
import departements from "@/client/constants/départements.json";
import regions from "@/client/constants/régions.json";
import { Maille } from "@/server/domain/maille/Maille.interface";
import { Avancement } from "@/server/domain/chantier/avancement/Avancement.interface";
import { AgregatParTerritoire } from "./agregateur.interface";

export type ChantierPourAgregation = {
  mailles: Record<
    Maille,
    Record<
      string,
      {
        estApplicable: boolean | null;
        avancement: Avancement;
        dateTauxAvancementAnnuel: string | null;
      }
    >
  >;
};

type AvancementRegroupementDonneesBrutes = {
  global: (number | null)[];
  annuel: (number | null)[];
};

export class AgregateurListeChantiersParTerritoire {
  private readonly agregat: AgregatParTerritoire;

  constructor(private chantiers: ChantierPourAgregation[]) {
    this.chantiers = chantiers;
    this.agregat = this._creerAgregatInitial();
  }

  agreger() {
    this._repartirLesDonneesBrutesPourChaqueTerritoire();
    this._calculerLesRepartitions("nationale");
    this._calculerLesRepartitions("departementale");
    this._calculerLesRepartitions("regionale");
    return this.agregat;
  }

  private _repartirLesDonneesBrutesPourChaqueTerritoire() {
    this.chantiers.forEach((chantier) => {
      objectEntries(chantier.mailles["nationale"]).forEach(
        ([territoireCode, donneesTerritoire]) => {
          if (donneesTerritoire.estApplicable) {
            this.agregat["nationale"].territoires[
              territoireCode
            ].donneesBrutes.avancements = [
              ...this.agregat["nationale"].territoires[territoireCode]
                .donneesBrutes.avancements,
              donneesTerritoire.avancement,
            ];
          }
        },
      );
      objectEntries(chantier.mailles["departementale"]).forEach(
        ([territoireCode, donneesTerritoire]) => {
          if (donneesTerritoire.estApplicable) {
            this.agregat["departementale"].territoires[
              territoireCode
            ].donneesBrutes.avancements = [
              ...this.agregat["departementale"].territoires[territoireCode]
                .donneesBrutes.avancements,
              donneesTerritoire.avancement,
            ];
          }
        },
      );
      objectEntries(chantier.mailles["regionale"]).forEach(
        ([territoireCode, donneesTerritoire]) => {
          if (donneesTerritoire.estApplicable) {
            this.agregat["regionale"].territoires[
              territoireCode
            ].donneesBrutes.avancements = [
              ...this.agregat["regionale"].territoires[territoireCode]
                .donneesBrutes.avancements,
              donneesTerritoire.avancement,
            ];
          }
        },
      );
    });
  }

  private _calculerLesRepartitions(maille: Maille) {
    let avancementsPourCetteMaille: AvancementRegroupementDonneesBrutes = {
      global: [],
      annuel: [],
    };
    objectEntries(this.agregat[maille].territoires).forEach(
      ([territoireCode, donneesTerritoire]) => {
        let avancementsPourCeTerritoireCode: AvancementRegroupementDonneesBrutes =
          {
            global: [],
            annuel: [],
          };
        avancementsPourCeTerritoireCode.global =
          donneesTerritoire.donneesBrutes.avancements.map(
            (avancement) => avancement.global,
          );
        avancementsPourCeTerritoireCode.annuel =
          donneesTerritoire.donneesBrutes.avancements.map(
            (avancement) => avancement.annuel,
          );
        avancementsPourCetteMaille.global = [
          ...avancementsPourCetteMaille.global,
          ...avancementsPourCeTerritoireCode.global,
        ];
        avancementsPourCetteMaille.annuel = [
          ...avancementsPourCetteMaille.annuel,
          ...avancementsPourCeTerritoireCode.annuel,
        ];

        this._calculerRepartitionAvancementsParTerritoire(
          maille,
          avancementsPourCeTerritoireCode,
          territoireCode,
        );
      },
    );

    this._calculerRepartitionAvancementsParMaille(
      maille,
      avancementsPourCetteMaille,
    );
  }

  private _calculerRepartitionAvancementsParTerritoire(
    maille: Maille,
    avancements: AvancementRegroupementDonneesBrutes,
    territoireCode: string,
  ) {
    this.agregat[maille].territoires[
      territoireCode
    ].repartition.avancements.global.minimum = valeurMinimum(
      avancements.global,
    );
    this.agregat[maille].territoires[
      territoireCode
    ].repartition.avancements.global.maximum = valeurMaximum(
      avancements.global,
    );
    this.agregat[maille].territoires[
      territoireCode
    ].repartition.avancements.global.moyenne = calculerMoyenne(
      avancements.global,
    );
    this.agregat[maille].territoires[
      territoireCode
    ].repartition.avancements.global.mediane = calculerMediane(
      avancements.global,
    );

    this.agregat[maille].territoires[
      territoireCode
    ].repartition.avancements.annuel.moyenne = calculerMoyenne(
      avancements.annuel,
    );
  }

  private _calculerRepartitionAvancementsParMaille(
    maille: Maille,
    avancements: AvancementRegroupementDonneesBrutes,
  ) {
    this.agregat[maille].repartition.avancements.global.minimum = valeurMinimum(
      avancements.global,
    );
    this.agregat[maille].repartition.avancements.global.maximum = valeurMaximum(
      avancements.global,
    );
    this.agregat[maille].repartition.avancements.global.moyenne =
      calculerMoyenne(avancements.global);
    this.agregat[maille].repartition.avancements.global.mediane =
      calculerMediane(avancements.global);

    this.agregat[maille].repartition.avancements.annuel.moyenne =
      calculerMoyenne(avancements.annuel);
  }

  private _creerDonneesInitialesTerritoire() {
    return {
      repartition: {
        avancements: {
          global: {
            moyenne: null,
            mediane: null,
            minimum: null,
            maximum: null,
          },
          annuel: {
            moyenne: null,
          },
        },
      },
      donneesBrutes: {
        avancements: [],
      },
    };
  }

  private _creerDonneesInitialesMaille(listeDeTerritoireCode: string[]) {
    return {
      repartition: {
        avancements: {
          global: {
            moyenne: null,
            mediane: null,
            minimum: null,
            maximum: null,
          },
          annuel: {
            moyenne: null,
          },
        },
      },
      territoires: Object.fromEntries(
        listeDeTerritoireCode.map((territoireCode) => [
          territoireCode,
          this._creerDonneesInitialesTerritoire(),
        ]),
      ),
    };
  }

  private _creerAgregatInitial(): AgregatParTerritoire {
    return {
      nationale: this._creerDonneesInitialesMaille(["NAT-FR"]),
      departementale: this._creerDonneesInitialesMaille(
        departements.map((departement) => departement.territoireCode),
      ),
      regionale: this._creerDonneesInitialesMaille(
        regions.map((region) => region.territoireCode),
      ),
    };
  }
}
