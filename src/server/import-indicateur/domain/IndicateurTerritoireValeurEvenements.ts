import groupBy from "lodash.groupby";
import mapValues from "lodash.mapvalues";
import { randomUUID } from "node:crypto";
import { IndicateurTerritoireValeurEvenement } from "@/server/import-indicateur/domain/IndicateurTerritoireValeurEvenement";
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

    // Calculer l'ordre suivant pour cette date_valeur
    const evenementsPourCetteDate = EvenementsSurDate.pourDate(
      {
        date: indicateurData.metricDate,
        indicId: this._indicId,
        territoireCode: this._territoireCode,
      },
      this._evenements,
    );
    let ordreActuel = evenementsPourCetteDate.prochainOrdre();

    const evenementsExistantParDate: Record<string, EvenementsSurDate> =
      mapValues(
        groupBy(
          this._evenements,
          (evenement) => evenement.dateValeur.toISOString().split("T")[0],
        ),
        (evenementsSurDate, date) =>
          new EvenementsSurDate(
            {
              date,
              indicId: this._indicId,
              territoireCode: this._territoireCode,
            },
            evenementsSurDate,
            this._evenements,
          ),
      );

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
        doitIgnorer =
          Number.parseFloat(indicateurData.metricValue) ===
          evenementsPourDate.valeurEnCours();
        continue;
      }

      const aPropositionValeurEnEcours =
        evenementsPourDate.evenementPropositionValeurEnCours();
      if (aPropositionValeurEnEcours) {
        nouveauxEvenements.push(
          evenementsPourDate.creerEvenementPropositionValeurIgnoreeValeurHistorisee(
            auteurId,
          ),
        );
      }

      const estHistorise = evenementsPourDate.aValeurHistorisee();
      if (!estHistorise) {
        nouveauxEvenements.push(
          evenementsPourDate.creerEvenementHistorisation(auteurId),
        );
      }
    }

    if (doitIgnorer) {
      // Ajouter les nouveaux événements au stream en mémoire
      this._evenements.unshift(...[...nouveauxEvenements].reverse());
      return nouveauxEvenements;
    }

    const aPropositionValeurEnCours =
      evenementsPourCetteDate.evenementPropositionValeurEnCours();
    if (aPropositionValeurEnCours) {
      // TODO: à supprimer (en cours de refacto)
      ordreActuel++;
      // TODO - que fait-on de la vraie table proposition_valeur_actuelle ?
      //    ici on enregistre les evenements mais d'impact sur la proposition réelle
      nouveauxEvenements.push(
        evenementsPourCetteDate.creerEvenementPropositionValeurIgnoreeValeurModifiee(
          auteurId,
        ),
      );
    }

    const evenementCreationOuModification = this._creerEvenementPrincipal(
      indicateurData,
      auteurId,
      doitModifierValeurCreee,
      ordreActuel++,
    );

    nouveauxEvenements.push(evenementCreationOuModification);
    evenementsPourCetteDate.ajouterEvenement(evenementCreationOuModification);

    if (doitHistoriserValeurCreee) {
      nouveauxEvenements.push(
        evenementsPourCetteDate.creerEvenementHistorisationFuture(
          indicateurData,
          auteurId,
        ),
      );
    }

    return nouveauxEvenements;
  }

  private _creerEvenementPrincipal(
    indicateurData: IndicateurData,
    auteurId: string,
    doitModifier: boolean,
    ordre: number,
  ): IndicateurTerritoireValeurEvenement {
    return IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
      {
        indicId: this._indicId,
        territoireCode: this._territoireCode,
        typeEvenement: doitModifier ? "VALEUR_MODIFIEE" : "VALEUR_CREEE",
        typeValeur: "VALEUR_AVANCEMENT",
        dateValeur: new Date(indicateurData.metricDate),
        valeur: Number.parseFloat(indicateurData.metricValue),
        donneesComplementaires: {},
        idAuteurModification: auteurId,
        correlationId: randomUUID(),
        ordre,
      },
    );
  }
}
