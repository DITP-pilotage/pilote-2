import { ErreurValidationFichier } from '@/server/import-indicateur/infrastructure/adapters/ValidataFichierIndicateurValidationService';

export class ErreurValidationFichierBuilder {
  private cellule: string = 'IND-12';

  private nom: string = 'INDICATEUR_INVALIDE';

  private message: string = 'L\'indicateur est invalide';

  private numeroDeLigne: number = 0;

  private positionDeLigne: number = 0;

  private nomDuChamp: string = 'indic_id';

  private positionDuChamp: number = 0;

  avecCellule(cellule: string) {
    this.cellule = cellule;
    return this;
  }

  avecNom(nom: string) {
    this.nom = nom;
    return this;
  }

  avecMessage(message: string) {
    this.message = message;
    return this;
  }

  avecNumeroDeLigne(numeroDeLigne: number) {
    this.numeroDeLigne = numeroDeLigne;
    return this;
  }

  avecPositionDeLigne(positionDeLigne: number) {
    this.positionDeLigne = positionDeLigne;
    return this;
  }

  avecNomDuChamp(nomDuChamp: string) {
    this.nomDuChamp = nomDuChamp;
    return this;
  }

  avecPositionDuChamp(positionDuChamp: number) {
    this.positionDuChamp = positionDuChamp;
    return this;
  }

  build(): ErreurValidationFichier {
    return ErreurValidationFichier.creerErreurValidationFichier({
      cellule: this.cellule,
      nom: this.nom,
      message: this.message,
      numeroDeLigne: this.numeroDeLigne,
      positionDeLigne: this.positionDeLigne,
      nomDuChamp: this.nomDuChamp,
      positionDuChamp: this.positionDuChamp,
    });
  }
}
