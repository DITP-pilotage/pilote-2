import groupBy from "lodash.groupby";
import mapValues from "lodash.mapvalues";
import { randomUUID } from "node:crypto";
import { IndicateurTerritoireValeurEvenement } from "@/server/import-indicateur/domain/IndicateurTerritoireValeurEvenement";
import { IndicateurData } from "@/server/import-indicateur/domain/IndicateurData";

const estPropositionEnCours = (
  evenementsPropositionValeur: IndicateurTerritoireValeurEvenement | undefined,
) =>
  evenementsPropositionValeur?.typeEvenement === "PROPOSITION_VALEUR_CREEE" ||
  evenementsPropositionValeur?.typeEvenement === "PROPOSITION_VALEUR_MODIFIEE";

class EvenementsSurDate {
  constructor(
    private date: string,
    private evenementsSurDate: IndicateurTerritoireValeurEvenement[],
    private tousLesEvenements: IndicateurTerritoireValeurEvenement[],
  ) {}

  static pourDate(
    date: string,
    evenements: IndicateurTerritoireValeurEvenement[],
  ) {
    const evenementsSurDate = evenements.filter(
      (evenement) => evenement.dateValeur.toISOString().split("T")[0] === date,
    );
    return new EvenementsSurDate(date, evenementsSurDate, evenements);
  }

  ajouterEvenement(evenement: IndicateurTerritoireValeurEvenement) {
    this.evenementsSurDate.unshift(evenement);
    this.tousLesEvenements.push(evenement);
  }

  prochainOrdre() {
    return IndicateurTerritoireValeurEvenement.prochainOrdre(
      this.evenementsSurDate,
    );
  }

  valeurEnCours() {
    return this.evenementsValeur()[0]?.valeur ?? null;
  }

  aValeurHistorisee() {
    return this.evenementsValeur().some(
      (evenement) => evenement.typeEvenement === "VALEUR_HISTORISEE",
    );
  }

  evenementsValeur() {
    return this.evenementsSurDate.filter((evenement) =>
      evenement.typeEvenement.startsWith("VALEUR_"),
    );
  }

  evenementsPropositionValeur() {
    return this.evenementsSurDate.filter((evenement) =>
      evenement.typeEvenement.startsWith("PROPOSITION_VALEUR_"),
    );
  }

  evenementPropositionValeurEnCours() {
    const evenementPropositionValeurLePlusRecent =
      this.evenementsPropositionValeur()[0];

    if (estPropositionEnCours(evenementPropositionValeurLePlusRecent)) {
      return evenementPropositionValeurLePlusRecent;
    }

    return null;
  }
}

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
    const evenementsPourCetteDate = EvenementsSurDate.pourDate(
      dateValeur,
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
          new EvenementsSurDate(date, evenementsSurDate, this._evenements),
      );

    let doitHistoriserValeurCreee = false;
    let doitModifierValeurCreee = false;
    let doitIgnorer = false;

    for (const [date, evenementsPourDate] of Object.entries(
      evenementsExistantParDate,
    )) {
      if (date > indicateurData.metricDate) {
        const evenementsSurDateImportee =
          evenementsExistantParDate[indicateurData.metricDate];
        doitHistoriserValeurCreee = !evenementsSurDateImportee
          ? true
          : !evenementsSurDateImportee.aValeurHistorisee();
        continue;
      }
      if (date === indicateurData.metricDate) {
        doitModifierValeurCreee = true;
        doitIgnorer =
          Number.parseFloat(indicateurData.metricValue) ===
          evenementsPourDate.valeurEnCours();
        continue;
      }

      const evenementPropositionValeur =
        evenementsPourDate.evenementPropositionValeurEnCours();
      if (evenementPropositionValeur) {
        const evenementPropositionValeurIgnoreeValeurHistorisee =
          this._creerEvenementPropositionValeurIgnoreeValeurHistorisee(
            evenementPropositionValeur,
            auteurId,
            evenementsExistantParDate[date].prochainOrdre(),
          );
        evenementsExistantParDate[date].ajouterEvenement(
          evenementPropositionValeurIgnoreeValeurHistorisee,
        );
        nouveauxEvenements.push(
          evenementPropositionValeurIgnoreeValeurHistorisee,
        );
      }

      const estHistorise = evenementsPourDate.aValeurHistorisee();
      if (!estHistorise) {
        const evenement = this._creerEvenementHistorisation(auteurId, date);
        evenementsPourDate.ajouterEvenement(evenement);
        nouveauxEvenements.push(evenement);
      }
    }

    if (doitIgnorer) {
      // Ajouter les nouveaux événements au stream en mémoire
      this._evenements.unshift(...[...nouveauxEvenements].reverse());
      return nouveauxEvenements;
    }

    const evenementsPropositionValeur =
      evenementsPourCetteDate.evenementPropositionValeurEnCours();
    if (evenementsPropositionValeur) {
      // TODO - que fait-on de la vraie table proposition_valeur_actuelle ?
      //    ici on enregistre les evenements mais d'impact sur la proposition réelle
      const evenementPropositionValeurIgnoreeValeurModifiee =
        this._creerEvenementPropositionValeurIgnoreeValeurModifiee(
          evenementsPropositionValeur,
          auteurId,
          ordreActuel++,
        );
      evenementsExistantParDate[indicateurData.metricDate].ajouterEvenement(
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

    evenementsExistantParDate[indicateurData.metricDate] ??=
      new EvenementsSurDate(indicateurData.metricDate, [], this._evenements);

    nouveauxEvenements.push(evenementCreationOuModification);
    evenementsExistantParDate[indicateurData.metricDate].ajouterEvenement(
      evenementCreationOuModification,
    );

    if (doitHistoriserValeurCreee) {
      const evenementHistorise = this._creerEvenementHistorisationFuture(
        indicateurData,
        auteurId,
        ordreActuel++,
      );
      nouveauxEvenements.push(evenementHistorise);

      evenementsExistantParDate[indicateurData.metricDate].ajouterEvenement(
        evenementHistorise,
      );
    }

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
