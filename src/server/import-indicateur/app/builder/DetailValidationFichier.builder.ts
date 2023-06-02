import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';
import { MesureIndicateurTemporaire } from '@/server/import-indicateur/domain/MesureIndicateurTemporaire';
import { ErreurValidationFichier } from '@/server/import-indicateur/domain/ErreurValidationFichier';
import { IndicateurData } from '@/server/import-indicateur/domain/IndicateurData';

export class DetailValidationFichierBuilder {
  private id: string = 'rapportId';

  private utilisateurEmail: string = 'utilisateurEmail';

  private dateCreation: Date = new Date();

  private estValide: boolean = false;

  private listeErreursValidation: ErreurValidationFichier[] = [];

  private listeMesuresIndicateurTemporaire: MesureIndicateurTemporaire[] = [];

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

  avecListeMesuresIndicateurTemporaire(...listeMesuresIndicateurTemporaire: MesureIndicateurTemporaire[]): DetailValidationFichierBuilder {
    this.listeMesuresIndicateurTemporaire = listeMesuresIndicateurTemporaire;
    return this;
  }
  
  avecListeIndicateursData(...listeIndicateursData: IndicateurData[]): DetailValidationFichierBuilder {
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
      listeMesuresIndicateurTemporaire: this.listeMesuresIndicateurTemporaire,
      listeIndicateursData: this.listeIndicateursData,
    });
  }
}
