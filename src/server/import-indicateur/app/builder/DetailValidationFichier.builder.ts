import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';
import { IndicateurData } from '@/server/import-indicateur/domain/IndicateurData';
import { ErreurValidationFichier } from '@/server/import-indicateur/domain/ErreurValidationFichier';

export class DetailValidationFichierBuilder {
  private id: string = 'rapportId';

  private utilisateurEmail: string = 'utilisateurEmail';

  private dateCreation: Date = new Date();

  private estValide: boolean = false;

  private listeErreursValidation: ErreurValidationFichier[] = [];

  private listeIndicateursData: IndicateurData[] = [];

  avecId(id: string) {
    this.id = id;
    return this;
  }

  avecDateCreation(dateCreation: Date): DetailValidationFichierBuilder {
    this.dateCreation = dateCreation;
    return this;
  }

  avecUtilisateurEmail(utilisateurEmail: string): DetailValidationFichierBuilder {
    this.utilisateurEmail = utilisateurEmail;
    return this;
  }

  avecEstValide(estValide: boolean): DetailValidationFichierBuilder {
    this.estValide = estValide;
    return this;
  }

  avecListeErreursValidation(...listeErreursValidation: ErreurValidationFichier[]): DetailValidationFichierBuilder {
    this.listeErreursValidation = listeErreursValidation;
    return this;
  }

  avecListeIndicateurData(...listeIndicateursData: IndicateurData[]): DetailValidationFichierBuilder {
    this.listeIndicateursData = listeIndicateursData;
    return this;
  }

  build(): DetailValidationFichier {
    return DetailValidationFichier.creerDetailValidationFichier({
      id: this.id,
      utilisateurEmail: this.utilisateurEmail,
      dateCreation: this.dateCreation,
      estValide: this.estValide,
      listeErreursValidation: this.listeErreursValidation,
      listeIndicateursData: this.listeIndicateursData,
    });
  }
}
