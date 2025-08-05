import { randomUUID } from "node:crypto";
import { IndicateurTerritoireValeurEvenement } from "@/server/import-indicateur/domain/IndicateurTerritoireValeurEvenement";
import { IndicateurData } from "./IndicateurData";

const estPropositionEnCours = (
  evenementsPropositionValeur: IndicateurTerritoireValeurEvenement | undefined,
) =>
  evenementsPropositionValeur?.typeEvenement === "PROPOSITION_VALEUR_CREEE" ||
  evenementsPropositionValeur?.typeEvenement === "PROPOSITION_VALEUR_MODIFIEE";

type IdentifiantFlux = {
  indicId: string;
  territoireCode: string;
  date: string;
};

export class EvenementsSurDate {
  constructor(
    private identifiantFlux: IdentifiantFlux,
    private evenementsSurDate: IndicateurTerritoireValeurEvenement[],
    private tousLesEvenements: IndicateurTerritoireValeurEvenement[],
  ) {}

  static pourDate(
    identifiantFlux: IdentifiantFlux,
    evenements: IndicateurTerritoireValeurEvenement[],
  ) {
    const evenementsSurDate = evenements.filter(
      (evenement) =>
        evenement.dateValeur.toISOString().split("T")[0] ===
        identifiantFlux.date,
    );
    return new EvenementsSurDate(
      identifiantFlux,
      evenementsSurDate,
      evenements,
    );
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

  aValeurEnCours(valeur: number): boolean {
    return this.valeurEnCours() === valeur;
  }

  aValeurHistorisee() {
    return this.evenementsValeur().some(
      (evenement) => evenement.typeEvenement === "VALEUR_HISTORISEE",
    );
  }

  evenementsValeur() {
    return this.evenementsSurDate
      .filter((evenement) => evenement.typeEvenement.startsWith("VALEUR_"))
      .sort((evenement1, evenement2) => evenement2.ordre - evenement1.ordre);
  }

  evenementsPropositionValeur() {
    return this.evenementsSurDate
      .filter((evenement) =>
        evenement.typeEvenement.startsWith("PROPOSITION_VALEUR_"),
      )
      .sort((evenement1, evenement2) => evenement2.ordre - evenement1.ordre);
  }

  evenementPropositionValeurEnCours() {
    const evenementPropositionValeurLePlusRecent =
      this.evenementsPropositionValeur()[0];

    if (estPropositionEnCours(evenementPropositionValeurLePlusRecent)) {
      return evenementPropositionValeurLePlusRecent;
    }

    return null;
  }

  estEvenementPropositionValeurAccuseeReception() {
    const evenementPropositionValeurLePlusRecent =
      this.evenementsPropositionValeur()[0];

    return (
      evenementPropositionValeurLePlusRecent?.typeEvenement ===
      "PROPOSITION_VALEUR_ACCUSEE_RECEPTION"
    );
  }

  creerEvenementValeurHistorisee(auteurId: string) {
    const valeurEnCours = this.valeurEnCours();
    if (valeurEnCours == null)
      throw new Error("Pas de valeur en cours pour l'historisation");

    const evenement =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: this.identifiantFlux.indicId,
          territoireCode: this.identifiantFlux.territoireCode,
          typeEvenement: "VALEUR_HISTORISEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: this.dateValeur(),
          valeur: valeurEnCours,
          donneesComplementaires: {},
          idAuteurModification: auteurId,
          correlationId: randomUUID(),
          ordre: this.prochainOrdre(),
        },
      );
    this.ajouterEvenement(evenement);
    return evenement;
  }

  creerEvenementValeurHistoriseeACreation(
    indicateurData: IndicateurData,
    auteurId: string,
  ) {
    const evenement =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: this.identifiantFlux.indicId,
          territoireCode: this.identifiantFlux.territoireCode,
          typeEvenement: "VALEUR_HISTORISEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: new Date(indicateurData.metricDate),
          valeur: Number.parseFloat(indicateurData.metricValue),
          donneesComplementaires: {},
          idAuteurModification: auteurId,
          correlationId: randomUUID(),
          ordre: this.prochainOrdre(),
        },
      );

    this.ajouterEvenement(evenement);
    return evenement;
  }

  creerEvenementPropositionValeurIgnoreeValeurHistorisee(
    auteurId: string,
  ): IndicateurTerritoireValeurEvenement {
    const evenementPropositionValeur = this.evenementPropositionValeurEnCours();
    if (!evenementPropositionValeur)
      throw new Error("Pas d'evenement PROPOSITION_VALEUR en cours");
    const evenement =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: this.identifiantFlux.indicId,
          territoireCode: this.identifiantFlux.territoireCode,
          typeEvenement: "PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: evenementPropositionValeur.dateValeur,
          valeur: evenementPropositionValeur.valeur,
          donneesComplementaires: {},
          idAuteurModification: auteurId,
          correlationId: randomUUID(),
          ordre: this.prochainOrdre(),
        },
      );
    this.ajouterEvenement(evenement);
    return evenement;
  }

  creerEvenementPropositionValeurIgnoreeValeurModifiee(auteurId: string) {
    const evenementExistant = this.evenementPropositionValeurEnCours();
    if (!evenementExistant)
      throw new Error("Pas d'evenement PROPOSITION_VALEUR en cours");

    const evenement =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: this.identifiantFlux.indicId,
          territoireCode: this.identifiantFlux.territoireCode,
          typeEvenement: "PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: evenementExistant.dateValeur,
          valeur: evenementExistant.valeur,
          donneesComplementaires: {},
          idAuteurModification: auteurId,
          correlationId: randomUUID(),
          ordre: this.prochainOrdre(),
        },
      );

    this.ajouterEvenement(evenement);
    return evenement;
  }

  creerEvenementValeurCreeeOuModifiee(
    indicateurData: IndicateurData,
    auteurId: string,
    estValeurModifiee: boolean,
  ) {
    const evenement =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: this.identifiantFlux.indicId,
          territoireCode: this.identifiantFlux.territoireCode,
          typeEvenement: estValeurModifiee ? "VALEUR_MODIFIEE" : "VALEUR_CREEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: new Date(indicateurData.metricDate),
          valeur: Number.parseFloat(indicateurData.metricValue),
          donneesComplementaires: {},
          idAuteurModification: auteurId,
          correlationId: randomUUID(),
          ordre: this.prochainOrdre(),
        },
      );

    this.ajouterEvenement(evenement);
    return evenement;
  }

  creerEvenementPropositionValeurCreee(valeur: number, auteurId: string) {
    if (this.evenementPropositionValeurEnCours()) {
      throw new Error("Une proposition de valeur est déjà en cours");
    }
    if (this.estEvenementPropositionValeurAccuseeReception()) {
      throw new Error("La proposition de valeur a déjà été accusée réception");
    }
    const evenement =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: this.identifiantFlux.indicId,
          territoireCode: this.identifiantFlux.territoireCode,
          typeEvenement: "PROPOSITION_VALEUR_CREEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: this.dateValeur(),
          valeur,
          donneesComplementaires: {},
          idAuteurModification: auteurId,
          correlationId: randomUUID(),
          ordre: this.prochainOrdre(),
        },
      );

    this.ajouterEvenement(evenement);
    return evenement;
  }

  creerEvenementPropositionValeurModifiee(valeur: number, auteurId: string) {
    if (this.estEvenementPropositionValeurAccuseeReception()) {
      throw new Error("La proposition de valeur a déjà été accusée réception");
    }
    if (!this.evenementPropositionValeurEnCours()) {
      throw new Error("Aucune proposition de valeur n'est en cours");
    }
    const evenement =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: this.identifiantFlux.indicId,
          territoireCode: this.identifiantFlux.territoireCode,
          typeEvenement: "PROPOSITION_VALEUR_MODIFIEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: this.dateValeur(),
          valeur,
          donneesComplementaires: {},
          idAuteurModification: auteurId,
          correlationId: randomUUID(),
          ordre: this.prochainOrdre(),
        },
      );

    this.ajouterEvenement(evenement);
    return evenement;
  }

  creerEvenementPropositionValeurSupprimee(auteurId: string) {
    const evenementPropositionEnCours =
      this.evenementPropositionValeurEnCours();
    if (!evenementPropositionEnCours) {
      // TODO - impossible si pas de proposition en cours
      //  ajouter les tests
      throw new Error("Pas d'evenement PROPOSITION_VALEUR en cours");
    }
    // TODO - vérifier que pas accusee_reception

    const evenement =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: this.identifiantFlux.indicId,
          territoireCode: this.identifiantFlux.territoireCode,
          typeEvenement: "PROPOSITION_VALEUR_SUPPRIMEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: this.dateValeur(),
          valeur: evenementPropositionEnCours.valeur,
          donneesComplementaires: {},
          idAuteurModification: auteurId,
          correlationId: randomUUID(),
          ordre: this.prochainOrdre(),
        },
      );

    this.ajouterEvenement(evenement);
    return evenement;
  }

  creerEvenementPropositionValeurAccuseeReception(auteurId: string) {
    const evenementPropositionEnCours =
      this.evenementPropositionValeurEnCours();
    if (!evenementPropositionEnCours) {
      // TODO - impossible si pas de proposition en cours
      //  ajouter les tests
      throw new Error("Pas d'evenement PROPOSITION_VALEUR en cours");
    }

    const evenement =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: this.identifiantFlux.indicId,
          territoireCode: this.identifiantFlux.territoireCode,
          typeEvenement: "PROPOSITION_VALEUR_ACCUSEE_RECEPTION",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: this.dateValeur(),
          valeur: evenementPropositionEnCours.valeur,
          donneesComplementaires: {},
          idAuteurModification: auteurId,
          correlationId: randomUUID(),
          ordre: this.prochainOrdre(),
        },
      );

    this.ajouterEvenement(evenement);
    return evenement;
  }

  creerEvenementPropositionValeurRefusee(auteurId: string) {
    const evenementPropositionEnCours =
      this.evenementPropositionValeurEnCours();
    // TODO - refus possible si accusee_reception
    if (!evenementPropositionEnCours) {
      // TODO - impossible si pas de proposition en cours
      //  ajouter les tests
      throw new Error("Pas d'evenement PROPOSITION_VALEUR en cours");
    }

    const evenement =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: this.identifiantFlux.indicId,
          territoireCode: this.identifiantFlux.territoireCode,
          typeEvenement: "PROPOSITION_VALEUR_REFUSEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: this.dateValeur(),
          valeur: evenementPropositionEnCours.valeur,
          donneesComplementaires: {},
          idAuteurModification: auteurId,
          correlationId: randomUUID(),
          ordre: this.prochainOrdre(),
        },
      );

    this.ajouterEvenement(evenement);
    return evenement;
  }

  creerEvenementPropositionValeurAcceptee(auteurId: string) {
    const evenementPropositionEnCours =
      this.evenementPropositionValeurEnCours();
    // TODO - vérifier que pas accusee_reception
    if (!evenementPropositionEnCours) {
      // TODO - impossible si pas de proposition en cours
      //  ajouter les tests
      throw new Error("Pas d'evenement PROPOSITION_VALEUR en cours");
    }

    const evenement =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: this.identifiantFlux.indicId,
          territoireCode: this.identifiantFlux.territoireCode,
          typeEvenement: "PROPOSITION_VALEUR_ACCEPTEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: this.dateValeur(),
          valeur: evenementPropositionEnCours.valeur,
          donneesComplementaires: {},
          idAuteurModification: auteurId,
          correlationId: randomUUID(),
          ordre: this.prochainOrdre(),
        },
      );

    this.ajouterEvenement(evenement);
    return evenement;
  }

  creerEvenementPropositionValeurAccepteeAvecModification(
    auteurId: string,
    valeur: number,
  ) {
    const evenementPropositionEnCours =
      this.evenementPropositionValeurEnCours();
    if (!evenementPropositionEnCours) {
      // TODO - impossible si pas de proposition en cours
      //  ajouter les tests
      throw new Error("Pas d'evenement PROPOSITION_VALEUR en cours");
    }

    const evenement =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: this.identifiantFlux.indicId,
          territoireCode: this.identifiantFlux.territoireCode,
          typeEvenement: "PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: this.dateValeur(),
          valeur,
          donneesComplementaires: {},
          idAuteurModification: auteurId,
          correlationId: randomUUID(),
          ordre: this.prochainOrdre(),
        },
      );

    this.ajouterEvenement(evenement);
    return evenement;
  }

  private dateValeur() {
    return new Date(this.identifiantFlux.date);
  }
}
