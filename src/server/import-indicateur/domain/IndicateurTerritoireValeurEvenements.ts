import groupBy from "lodash.groupby";
import { randomUUID } from "node:crypto";
import { IndicateurTerritoireValeurEvenement } from "@/server/import-indicateur/domain/IndicateurTerritoireValeurEvenement";
import { IndicateurData } from "@/server/import-indicateur/domain/IndicateurData";

const estPropositionEnCours = (
  evenementsPropositionValeur: IndicateurTerritoireValeurEvenement | undefined,
) =>
  evenementsPropositionValeur?.typeEvenement === "PROPOSITION_VALEUR_CREEE" ||
  evenementsPropositionValeur?.typeEvenement === "PROPOSITION_VALEUR_MODIFIEE";

const getEvenementPropositionValeurLePlusRecent = (
  evenementsPourCetteDate: IndicateurTerritoireValeurEvenement[],
) =>
  evenementsPourCetteDate.find((evenement) =>
    evenement.typeEvenement.startsWith("PROPOSITION_VALEUR_"),
  );

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
    const dateValeur = indicateurData.metricDate;
    const evenementsPourCetteDate = this._evenements.filter(
      (evenement) =>
        evenement.dateValeur.toISOString().split("T")[0] === dateValeur,
    );
    let ordreActuel = IndicateurTerritoireValeurEvenement.prochainOrdre(
      evenementsPourCetteDate,
    );

    const evenementsExistantParDate = groupBy(
      this._evenements,
      (evenement) => evenement.dateValeur.toISOString().split("T")[0],
    );

    let doitHistoriserValeurCreee = false;
    let doitModifierValeurCreee = false;
    let doitIgnorer = false;

    for (const [date, evenementsPourDate] of Object.entries(
      evenementsExistantParDate,
    )) {
      if (date > indicateurData.metricDate) {
        doitHistoriserValeurCreee = !(
          evenementsExistantParDate[indicateurData.metricDate] ?? []
        ).some((evenement) => evenement.typeEvenement === "VALEUR_HISTORISEE");
        continue;
      }
      if (date === indicateurData.metricDate) {
        doitModifierValeurCreee = true;
        doitIgnorer =
          Number.parseFloat(indicateurData.metricValue) ===
          evenementsPourDate[0].valeur;
        continue;
      }

      const evenementPropositionValeur =
        getEvenementPropositionValeurLePlusRecent(evenementsPourDate);
      if (
        evenementPropositionValeur &&
        estPropositionEnCours(evenementPropositionValeur)
      ) {
        const evenementPropositionValeurIgnoreeValeurHistorisee =
          this._creerEvenementPropositionValeurIgnoreeValeurHistorisee(
            evenementPropositionValeur,
            auteurId,
            IndicateurTerritoireValeurEvenement.prochainOrdre(
              evenementsExistantParDate[date],
            ),
          );
        evenementsExistantParDate[date].unshift(
          evenementPropositionValeurIgnoreeValeurHistorisee,
        );
        this._evenements.push(
          evenementPropositionValeurIgnoreeValeurHistorisee,
        );
        nouveauxEvenements.push(
          evenementPropositionValeurIgnoreeValeurHistorisee,
        );
      }

      const estHistorise = evenementsPourDate.some(
        (evenement) => evenement.typeEvenement === "VALEUR_HISTORISEE",
      );
      if (!estHistorise) {
        const evenement = this._creerEvenementHistorisation(auteurId, date);

        nouveauxEvenements.push(evenement);
        evenementsPourDate.unshift(evenement);
      }
    }

    if (doitIgnorer) {
      // Ajouter les nouveaux événements au stream en mémoire
      this._evenements.unshift(...[...nouveauxEvenements].reverse());
      return nouveauxEvenements;
    }

    const evenementsPropositionValeur =
      getEvenementPropositionValeurLePlusRecent(evenementsPourCetteDate);
    const aPropositionEnCours = estPropositionEnCours(
      evenementsPropositionValeur,
    );
    if (evenementsPropositionValeur && aPropositionEnCours) {
      // TODO - que fait-on de la vraie table proposition_valeur_actuelle ?
      //    ici on enregistre les evenements mais d'impact sur la proposition réelle
      const evenementPropositionValeurIgnoreeValeurModifiee =
        this._creerEvenementPropositionValeurIgnoreeValeurModifiee(
          evenementsPropositionValeur,
          auteurId,
          ordreActuel++,
        );
      evenementsExistantParDate[indicateurData.metricDate].unshift(
        evenementPropositionValeurIgnoreeValeurModifiee,
      );
      nouveauxEvenements.push(evenementPropositionValeurIgnoreeValeurModifiee);
    }

    const evenementCreationOuModification = this._creerEvenementPrincipal(
      indicateurData,
      auteurId,
      doitModifierValeurCreee,
      ordreActuel++,
    );

    evenementsExistantParDate[indicateurData.metricDate] ??= [];

    nouveauxEvenements.push(evenementCreationOuModification);
    evenementsExistantParDate[indicateurData.metricDate].unshift(
      evenementCreationOuModification,
    );

    if (doitHistoriserValeurCreee) {
      const evenementHistorise = this._creerEvenementHistorisationFuture(
        indicateurData,
        auteurId,
        ordreActuel++,
      );
      nouveauxEvenements.push(evenementHistorise);

      evenementsExistantParDate[indicateurData.metricDate].unshift(
        evenementHistorise,
      );
    }

    // Ajouter les nouveaux événements au stream en mémoire
    this._evenements.unshift(...[...nouveauxEvenements].reverse());

    return nouveauxEvenements;
  }

  private _creerEvenementPropositionValeurIgnoreeValeurModifiee(
    evenementExistant: IndicateurTerritoireValeurEvenement,
    auteurId: string,
    ordre: number,
  ) {
    return IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
      {
        indicId: this._indicId,
        territoireCode: this._territoireCode,
        typeEvenement: "PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE",
        typeValeur: "VALEUR_AVANCEMENT",
        dateValeur: evenementExistant.dateValeur,
        valeur: evenementExistant.valeur,
        donneesComplementaires: {},
        idAuteurModification: auteurId,
        correlationId: randomUUID(),
        ordre,
      },
    );
  }

  private _creerEvenementPropositionValeurIgnoreeValeurHistorisee(
    evenementExistant: IndicateurTerritoireValeurEvenement,
    auteurId: string,
    ordre: number,
  ) {
    return IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
      {
        indicId: this._indicId,
        territoireCode: this._territoireCode,
        typeEvenement: "PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE",
        typeValeur: "VALEUR_AVANCEMENT",
        dateValeur: evenementExistant.dateValeur,
        valeur: evenementExistant.valeur,
        donneesComplementaires: {},
        idAuteurModification: auteurId,
        correlationId: randomUUID(),
        ordre,
      },
    );
  }

  private _creerEvenementHistorisation(
    auteurId: string,
    date: string,
  ): IndicateurTerritoireValeurEvenement {
    const evenementsPourCetteDate = this._evenements.filter(
      (evenement) => evenement.dateValeur.toISOString().split("T")[0] === date,
    );
    const evenementValeurPourDate = evenementsPourCetteDate.find((evenement) =>
      evenement.typeEvenement.startsWith("VALEUR_"),
    );

    let ordre = IndicateurTerritoireValeurEvenement.prochainOrdre(
      evenementsPourCetteDate,
    );
    return IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
      {
        indicId: this._indicId,
        territoireCode: this._territoireCode,
        typeEvenement: "VALEUR_HISTORISEE",
        typeValeur: "VALEUR_AVANCEMENT",
        dateValeur: evenementValeurPourDate!.dateValeur,
        valeur: evenementValeurPourDate!.valeur,
        donneesComplementaires: {},
        idAuteurModification: auteurId,
        correlationId: randomUUID(),
        ordre,
      },
    );
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

  private _creerEvenementHistorisationFuture(
    indicateurData: IndicateurData,
    auteurId: string,
    ordre: number,
  ): IndicateurTerritoireValeurEvenement {
    return IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
      {
        indicId: this._indicId,
        territoireCode: this._territoireCode,
        typeEvenement: "VALEUR_HISTORISEE",
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
