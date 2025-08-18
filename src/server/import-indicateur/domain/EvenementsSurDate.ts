import { randomUUID } from "node:crypto";
import {
  DonneesComplementaires,
  IndicateurTerritoireValeurEvenement,
} from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { IndicateurData } from "@/server/import-indicateur/domain/IndicateurData";

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
  readonly identifiantFlux: IdentifiantFlux;

  readonly evenementsSurDate: IndicateurTerritoireValeurEvenement[];

  readonly tousLesEvenements: IndicateurTerritoireValeurEvenement[];

  constructor({
    identifiantFlux,
    evenementsSurDate,
    tousLesEvenements,
  }: {
    identifiantFlux: IdentifiantFlux;
    evenementsSurDate: IndicateurTerritoireValeurEvenement[];
    tousLesEvenements: IndicateurTerritoireValeurEvenement[];
  }) {
    this.identifiantFlux = identifiantFlux;
    this.evenementsSurDate = evenementsSurDate;
    this.tousLesEvenements = tousLesEvenements;
  }

  static pourDate(
    identifiantFlux: IdentifiantFlux,
    evenements: IndicateurTerritoireValeurEvenement[],
  ) {
    const evenementsSurDate = evenements.filter(
      (evenement) =>
        evenement.dateValeur.toISOString().split("T")[0] ===
        identifiantFlux.date,
    );
    return new EvenementsSurDate({
      identifiantFlux,
      evenementsSurDate,
      tousLesEvenements: evenements,
    });
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

  evenementPropositionValeurAccuseeReception() {
    const evenementPropositionValeurLePlusRecent =
      this.evenementsPropositionValeur()[0];

    if (
      evenementPropositionValeurLePlusRecent?.typeEvenement ===
      "PROPOSITION_VALEUR_ACCUSEE_RECEPTION"
    )
      return evenementPropositionValeurLePlusRecent;

    return null;
  }

  estEvenementPropositionValeurAccuseeReception() {
    return this.evenementPropositionValeurAccuseeReception() !== null;
  }

  creerEvenementValeurHistorisee({ auteurId }: { auteurId: string }) {
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
          donneesComplementaires: undefined,
          idAuteurModification: auteurId,
          correlationId: randomUUID(),
          ordre: this.prochainOrdre(),
        },
      );
    this.ajouterEvenement(evenement);
    return evenement;
  }

  creerEvenementValeurHistoriseeACreation({
    indicateurData,
    auteurId,
  }: {
    indicateurData: IndicateurData;
    auteurId: string;
  }) {
    const evenement =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: this.identifiantFlux.indicId,
          territoireCode: this.identifiantFlux.territoireCode,
          typeEvenement: "VALEUR_HISTORISEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: new Date(indicateurData.metricDate),
          valeur: Number.parseFloat(indicateurData.metricValue),
          donneesComplementaires: undefined,
          idAuteurModification: auteurId,
          correlationId: randomUUID(),
          ordre: this.prochainOrdre(),
        },
      );

    this.ajouterEvenement(evenement);
    return evenement;
  }

  creerEvenementPropositionValeurIgnoreeValeurHistorisee({
    auteurId,
  }: {
    auteurId: string;
  }): IndicateurTerritoireValeurEvenement {
    const evenementPropositionValeur = this.evenementPropositionValeurEnCours();
    if (!evenementPropositionValeur)
      throw new Error("Aucune proposition de valeur n'est en cours");
    const evenement =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: this.identifiantFlux.indicId,
          territoireCode: this.identifiantFlux.territoireCode,
          typeEvenement: "PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: evenementPropositionValeur.dateValeur,
          valeur: evenementPropositionValeur.valeur,
          donneesComplementaires: undefined,
          idAuteurModification: auteurId,
          correlationId: randomUUID(),
          ordre: this.prochainOrdre(),
        },
      );
    this.ajouterEvenement(evenement);
    return evenement;
  }

  creerEvenementPropositionValeurIgnoreeValeurModifiee({
    auteurId,
  }: {
    auteurId: string;
  }) {
    const evenementExistant = this.evenementPropositionValeurEnCours();
    if (!evenementExistant)
      throw new Error("Aucune proposition de valeur n'est en cours");

    const evenement =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: this.identifiantFlux.indicId,
          territoireCode: this.identifiantFlux.territoireCode,
          typeEvenement: "PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: evenementExistant.dateValeur,
          valeur: evenementExistant.valeur,
          donneesComplementaires: undefined,
          idAuteurModification: auteurId,
          correlationId: randomUUID(),
          ordre: this.prochainOrdre(),
        },
      );

    this.ajouterEvenement(evenement);
    return evenement;
  }

  creerEvenementValeurCreeeOuModifiee({
    indicateurData,
    auteurId,
    estValeurModifiee,
  }: {
    indicateurData: IndicateurData;
    auteurId: string;
    estValeurModifiee: boolean;
  }) {
    const evenement =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: this.identifiantFlux.indicId,
          territoireCode: this.identifiantFlux.territoireCode,
          typeEvenement: estValeurModifiee ? "VALEUR_MODIFIEE" : "VALEUR_CREEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: new Date(indicateurData.metricDate),
          valeur: Number.parseFloat(indicateurData.metricValue),
          donneesComplementaires: undefined,
          idAuteurModification: auteurId,
          correlationId: randomUUID(),
          ordre: this.prochainOrdre(),
        },
      );

    this.ajouterEvenement(evenement);
    return evenement;
  }

  creerEvenementPropositionValeurCreee({
    valeur,
    auteurId,
    donneesComplementaires,
  }: {
    valeur: number;
    auteurId: string;
    donneesComplementaires: DonneesComplementaires<"PROPOSITION_VALEUR_CREEE">;
  }) {
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
          donneesComplementaires,
          idAuteurModification: auteurId,
          correlationId: randomUUID(),
          ordre: this.prochainOrdre(),
        },
      );

    this.ajouterEvenement(evenement);
    return evenement;
  }

  creerEvenementPropositionValeurModifiee({
    valeur,
    auteurId,
    donneesComplementaires,
  }: {
    valeur: number;
    auteurId: string;
    donneesComplementaires: DonneesComplementaires<"PROPOSITION_VALEUR_MODIFIEE">;
  }) {
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
          donneesComplementaires,
          idAuteurModification: auteurId,
          correlationId: randomUUID(),
          ordre: this.prochainOrdre(),
        },
      );

    this.ajouterEvenement(evenement);
    return evenement;
  }

  creerEvenementPropositionValeurSupprimee({ auteurId }: { auteurId: string }) {
    const evenementPropositionEnCours =
      this.evenementPropositionValeurEnCours();

    if (this.estEvenementPropositionValeurAccuseeReception()) {
      throw new Error("La proposition de valeur a déjà été accusée réception");
    }
    if (!evenementPropositionEnCours) {
      throw new Error("Aucune proposition de valeur n'est en cours");
    }

    const evenement =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: this.identifiantFlux.indicId,
          territoireCode: this.identifiantFlux.territoireCode,
          typeEvenement: "PROPOSITION_VALEUR_SUPPRIMEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: this.dateValeur(),
          valeur: evenementPropositionEnCours.valeur,
          donneesComplementaires: undefined,
          idAuteurModification: auteurId,
          correlationId: randomUUID(),
          ordre: this.prochainOrdre(),
        },
      );

    this.ajouterEvenement(evenement);
    return evenement;
  }

  creerEvenementPropositionValeurAccuseeReception({
    auteurId,
  }: {
    auteurId: string;
  }) {
    const evenementPropositionEnCours =
      this.evenementPropositionValeurEnCours();

    if (this.estEvenementPropositionValeurAccuseeReception()) {
      throw new Error("La proposition de valeur a déjà été accusée réception");
    }
    if (!evenementPropositionEnCours) {
      throw new Error("Aucune proposition de valeur n'est en cours");
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
          donneesComplementaires: undefined,
          idAuteurModification: auteurId,
          correlationId: randomUUID(),
          ordre: this.prochainOrdre(),
        },
      );

    this.ajouterEvenement(evenement);
    return evenement;
  }

  creerEvenementPropositionValeurRefusee({
    auteurId,
    motif,
  }: {
    auteurId: string;
    motif: string;
  }) {
    const evenementPropositionEnCours =
      this.evenementPropositionValeurEnCours() ??
      this.evenementPropositionValeurAccuseeReception();

    if (!evenementPropositionEnCours) {
      throw new Error("Aucune proposition de valeur n'est en cours");
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
          donneesComplementaires: { motif },
          idAuteurModification: auteurId,
          correlationId: randomUUID(),
          ordre: this.prochainOrdre(),
        },
      );

    this.ajouterEvenement(evenement);
    return evenement;
  }

  creerEvenementPropositionValeurAcceptee({
    auteurId,
    motif,
  }: {
    auteurId: string;
    motif: string;
  }) {
    const evenementPropositionEnCours =
      this.evenementPropositionValeurEnCours() ??
      this.evenementPropositionValeurAccuseeReception();

    if (!evenementPropositionEnCours) {
      throw new Error("Aucune proposition de valeur n'est en cours");
    }

    const evenementAcceptation =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: this.identifiantFlux.indicId,
          territoireCode: this.identifiantFlux.territoireCode,
          typeEvenement: "PROPOSITION_VALEUR_ACCEPTEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: this.dateValeur(),
          valeur: evenementPropositionEnCours.valeur,
          donneesComplementaires: { motif },
          idAuteurModification: auteurId,
          correlationId: randomUUID(),
          ordre: this.prochainOrdre(),
        },
      );
    this.ajouterEvenement(evenementAcceptation);

    const evenementModification =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: this.identifiantFlux.indicId,
          territoireCode: this.identifiantFlux.territoireCode,
          typeEvenement: "VALEUR_MODIFIEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: this.dateValeur(),
          valeur: evenementPropositionEnCours.valeur,
          donneesComplementaires: undefined,
          idAuteurModification: auteurId,
          correlationId: randomUUID(),
          ordre: this.prochainOrdre(),
        },
      );
    this.ajouterEvenement(evenementModification);

    return [evenementAcceptation, evenementModification];
  }

  creerEvenementPropositionValeurAccepteeAvecModification({
    auteurId,
    valeur,
  }: {
    auteurId: string;
    valeur: number;
  }) {
    const evenementPropositionEnCours =
      this.evenementPropositionValeurEnCours() ??
      this.evenementPropositionValeurAccuseeReception();

    if (!evenementPropositionEnCours) {
      throw new Error("Aucune proposition de valeur n'est en cours");
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
          donneesComplementaires: undefined,
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
