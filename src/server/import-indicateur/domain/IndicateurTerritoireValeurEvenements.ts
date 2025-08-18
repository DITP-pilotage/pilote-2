import groupBy from "lodash.groupby";
import mapValues from "lodash.mapvalues";
import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { IndicateurData } from "@/server/import-indicateur/domain/IndicateurData";
import { EvenementsSurDate } from "@/server/import-indicateur/domain/EvenementsSurDate";

export class IndicateurTerritoireValeurEvenements {
  private readonly _indicId: string;

  private readonly _territoireCode: string;

  private _evenements: IndicateurTerritoireValeurEvenement[];

  constructor({
    indicId,
    territoireCode,
    evenementsInitiaux = [],
  }: {
    indicId: string;
    territoireCode: string;
    evenementsInitiaux?: IndicateurTerritoireValeurEvenement[];
  }) {
    this._indicId = indicId;
    this._territoireCode = territoireCode;
    this._evenements = [...evenementsInitiaux];
  }

  ingererIndicateurData(
    indicateurData: IndicateurData,
    auteurId: string,
  ): IndicateurTerritoireValeurEvenement[] {
    const nouveauxEvenements: IndicateurTerritoireValeurEvenement[] = [];
    const evenementsExistantParDate = this.grouperEvenementsParDate();
    const evenementsPourCetteDate =
      evenementsExistantParDate[indicateurData.metricDate] ??
      this.creerEvenementsSurDateIndicateur(indicateurData);

    let doitHistoriserValeurCreee = false;
    let doitModifierValeurCreee = false;
    let doitIgnorer = false;

    for (const [date, evenementsPourDate] of Object.entries(
      evenementsExistantParDate,
    )) {
      if (date > indicateurData.metricDate) {
        doitHistoriserValeurCreee =
          !evenementsPourCetteDate.aValeurHistorisee();
        continue;
      }
      if (date === indicateurData.metricDate) {
        doitModifierValeurCreee = true;
        doitIgnorer = evenementsPourDate.aValeurEnCours(
          Number.parseFloat(indicateurData.metricValue),
        );
        continue;
      }

      const aPropositionValeurEnEcours =
        evenementsPourDate.evenementPropositionValeurEnCours();
      if (aPropositionValeurEnEcours) {
        nouveauxEvenements.push(
          evenementsPourDate.creerEvenementPropositionValeurIgnoreeValeurHistorisee(
            { auteurId },
          ),
        );
      }

      const estHistorise = evenementsPourDate.aValeurHistorisee();
      if (!estHistorise) {
        nouveauxEvenements.push(
          evenementsPourDate.creerEvenementValeurHistorisee({ auteurId }),
        );
      }
    }

    if (doitIgnorer) {
      return nouveauxEvenements;
    }

    const aPropositionValeurEnCours =
      evenementsPourCetteDate.evenementPropositionValeurEnCours();
    if (aPropositionValeurEnCours) {
      // TODO - que fait-on de la vraie table proposition_valeur_actuelle ?
      //    ici on enregistre les evenements mais d'impact sur la proposition réelle
      nouveauxEvenements.push(
        evenementsPourCetteDate.creerEvenementPropositionValeurIgnoreeValeurModifiee(
          { auteurId },
        ),
      );
    }

    nouveauxEvenements.push(
      evenementsPourCetteDate.creerEvenementValeurCreeeOuModifiee({
        indicateurData,
        auteurId,
        estValeurModifiee: doitModifierValeurCreee,
      }),
    );

    if (doitHistoriserValeurCreee) {
      nouveauxEvenements.push(
        evenementsPourCetteDate.creerEvenementValeurHistoriseeACreation({
          indicateurData,
          auteurId,
        }),
      );
    }

    return nouveauxEvenements;
  }

  private creerEvenementsSurDateIndicateur(indicateurData: IndicateurData) {
    return EvenementsSurDate.pourDate(
      {
        date: indicateurData.metricDate,
        indicId: this._indicId,
        territoireCode: this._territoireCode,
      },
      this._evenements,
    );
  }

  private grouperEvenementsParDate(): Record<string, EvenementsSurDate> {
    return mapValues(
      groupBy(
        this._evenements,
        (evenement) => evenement.dateValeur.toISOString().split("T")[0],
      ),
      (evenementsSurDate, date) =>
        new EvenementsSurDate({
          identifiantFlux: {
            date,
            indicId: this._indicId,
            territoireCode: this._territoireCode,
          },
          evenementsSurDate,
          tousLesEvenements: this._evenements,
        }),
    );
  }
}
