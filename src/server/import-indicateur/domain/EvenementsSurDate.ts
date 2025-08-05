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
          dateValeur: new Date(this.identifiantFlux.date),
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
}
