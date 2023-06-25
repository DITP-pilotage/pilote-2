import { InformationIndicateur } from '@/server/import-indicateur/domain/InformationIndicateur';

export class InformationIndicateurBuilder {
  private indicId: string = 'IND-110';

  private indicSchema: string = 'sans-contraintes.json';

  withIndicId(indicId: string): InformationIndicateurBuilder {
    this.indicId = indicId;
    return this;
  }

  withIndicSchema(indicSchema: string): InformationIndicateurBuilder {
    this.indicSchema = indicSchema;
    return this;
  }

  build(): InformationIndicateur {
    return InformationIndicateur.creerInformationIndicateur({
      indicId: this.indicId,
      indicSchema: this.indicSchema,
    });
  }
}
