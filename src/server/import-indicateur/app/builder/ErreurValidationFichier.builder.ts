import { ErreurValidationFichier } from '@/server/import-indicateur/domain/ErreurValidationFichier';

export class ErreurValidationFichierBuilder {
  private id: string = '4c92c525-b64e-4a4c-9ae2-1b74fd55d38a';
  
  private rapportId: string = 'db08d46d-1231-4cdd-82ac-eeadce68df4d';

  private cellule: string = 'IND-12';

  private nom: string = 'Indicateur invalide';

  private message: string = 'L\'indicateur est invalide';

  private numeroDeLigne: number = 0;

  private positionDeLigne: number = 0;

  private nomDuChamp: string = 'indic_id';

  private positionDuChamp: number = 0;

  avecId(id: string) {
    this.id = id;
    return this;
  }

  avecRapportId(rapportId: string) {
    this.rapportId = rapportId;
    return this;
  }

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
      id: this.id,
      rapportId: this.rapportId,
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
