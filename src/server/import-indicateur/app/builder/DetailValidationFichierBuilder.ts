import {
  ErreurValidationFichier,
} from '@/server/import-indicateur/infrastructure/adapters/ValidataFichierIndicateurValidationService';
import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';
import { IndicateurData } from '@/server/import-indicateur/domain/IndicateurData';

export class DetailValidationFichierBuilder {
  private estValide: boolean = false;

  private listeErreursValidation: ErreurValidationFichier[] = [];

  private listeIndicateursData: IndicateurData[] = [];

  avecEstValide(estValide: boolean) {
    this.estValide = estValide;
    return this;
  }

  avecListeErreursValidation(...listeErreursValidation: ErreurValidationFichier[]) {
    this.listeErreursValidation = listeErreursValidation;
    return this;
  }

  avecListeIndicateurData(...listeIndicateursData: IndicateurData[]) {
    this.listeIndicateursData = listeIndicateursData;
    return this;
  }

  build(): DetailValidationFichier {
    return DetailValidationFichier.creerDetailValidationFichier({
      estValide: this.estValide,
      listeErreursValidation: this.listeErreursValidation,
      listeIndicateursData: this.listeIndicateursData,
    });
  }
}
