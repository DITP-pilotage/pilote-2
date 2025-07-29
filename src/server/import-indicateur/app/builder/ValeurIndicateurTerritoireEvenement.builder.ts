import { ValeurIndicateurTerritoireEvenement } from "@/server/import-indicateur/domain/ValeurIndicateurTerritoireEvenement";
import { TypeEvenement } from "@/server/import-indicateur/domain/TypeEvenement";
import { TypeValeur } from "@/server/import-indicateur/domain/TypeValeur";

export class ValeurIndicateurTerritoireEvenementBuilder {
  private id: string = "default-event-id";

  private indicId: string = "IND-001";

  private territoireCode: string = "D001";

  private typeEvenement: TypeEvenement = "VALEUR_CREEE";

  private typeValeur: TypeValeur = "VALEUR_AVANCEMENT";

  private dateValeur: Date = new Date("2023-01-15");

  private donneesComplementaires: Record<string, unknown> = {};

  private idAuteurModification: string = "default-author-id";

  private correlationId: string = "default-correlation-id";

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

  avecDonneesComplementaires(
    donneesComplementaires: Record<string, unknown>,
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

  build(): ValeurIndicateurTerritoireEvenement {
    return ValeurIndicateurTerritoireEvenement.createValeurIndicateurTerritoireEvenement(
      {
        id: this.id,
        indicId: this.indicId,
        territoireCode: this.territoireCode,
        typeEvenement: this.typeEvenement,
        typeValeur: this.typeValeur,
        dateValeur: this.dateValeur,
        donneesComplementaires: this.donneesComplementaires,
        idAuteurModification: this.idAuteurModification,
        correlationId: this.correlationId,
      },
    );
  }
}
