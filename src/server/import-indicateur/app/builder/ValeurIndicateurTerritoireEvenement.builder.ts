import {
  DonneesComplementaires,
  IndicateurTerritoireValeurEvenement,
  ValeurEvenement,
} from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { TypeEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/TypeEvenement";
import { TypeValeur } from "@/server/indicateur-territoire-valeur-evenement/domain/TypeValeur";

export class ValeurIndicateurTerritoireEvenementBuilder {
  private id: string = "default-event-id";

  private indicId: string = "IND-001";

  private territoireCode: string = "D001";

  private typeEvenement: TypeEvenement = "VALEUR_CREEE";

  private typeValeur: TypeValeur = "VALEUR_AVANCEMENT";

  private dateValeur: Date = new Date("2023-01-15");

  private valeur: ValeurEvenement<TypeEvenement> = 75;

  private donneesComplementaires: DonneesComplementaires<TypeEvenement> =
    undefined;

  private idAuteurModification: string = "default-author-id";

  private correlationId: string = "default-correlation-id";

  private ordre: number = 1;

  private dateCreation: Date = new Date();

  avecId(id: string): ValeurIndicateurTerritoireEvenementBuilder {
    this.id = id;
    return this;
  }

  avecIndicId(indicId: string): ValeurIndicateurTerritoireEvenementBuilder {
    this.indicId = indicId;
    return this;
  }

  avecTerritoireCode(
    territoireCode: string,
  ): ValeurIndicateurTerritoireEvenementBuilder {
    this.territoireCode = territoireCode;
    return this;
  }

  avecTypeEvenement(
    typeEvenement: TypeEvenement,
  ): ValeurIndicateurTerritoireEvenementBuilder {
    this.typeEvenement = typeEvenement;
    return this;
  }

  avecTypeValeur(
    typeValeur: TypeValeur,
  ): ValeurIndicateurTerritoireEvenementBuilder {
    this.typeValeur = typeValeur;
    return this;
  }

  avecDateValeur(dateValeur: Date): ValeurIndicateurTerritoireEvenementBuilder {
    this.dateValeur = dateValeur;
    return this;
  }

  avecValeur(
    valeur: ValeurEvenement<TypeEvenement>,
  ): ValeurIndicateurTerritoireEvenementBuilder {
    this.valeur = valeur;
    return this;
  }

  avecDonneesComplementaires(
    donneesComplementaires: DonneesComplementaires<TypeEvenement>,
  ): ValeurIndicateurTerritoireEvenementBuilder {
    this.donneesComplementaires = donneesComplementaires;
    return this;
  }

  avecIdAuteurModification(
    idAuteurModification: string,
  ): ValeurIndicateurTerritoireEvenementBuilder {
    this.idAuteurModification = idAuteurModification;
    return this;
  }

  avecCorrelationId(
    correlationId: string,
  ): ValeurIndicateurTerritoireEvenementBuilder {
    this.correlationId = correlationId;
    return this;
  }

  avecOrdre(ordre: number): ValeurIndicateurTerritoireEvenementBuilder {
    this.ordre = ordre;
    return this;
  }

  avecDateCreation(
    dateCreation: Date,
  ): ValeurIndicateurTerritoireEvenementBuilder {
    this.dateCreation = dateCreation;
    return this;
  }

  build(): IndicateurTerritoireValeurEvenement {
    return IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
      {
        id: this.id,
        indicId: this.indicId,
        territoireCode: this.territoireCode,
        typeEvenement: this.typeEvenement,
        typeValeur: this.typeValeur,
        dateValeur: this.dateValeur,
        valeur: this.valeur,
        donneesComplementaires: this.donneesComplementaires,
        idAuteurModification: this.idAuteurModification,
        correlationId: this.correlationId,
        ordre: this.ordre,
        dateCreation: this.dateCreation,
      },
    );
  }
}
