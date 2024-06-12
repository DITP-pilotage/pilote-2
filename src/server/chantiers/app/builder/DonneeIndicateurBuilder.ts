import { DonneeIndicateur } from '@/server/chantiers/domain/DonneeIndicateur';

export class DonneeIndicateurBuilder {
  private indicId: string = 'IND-001';

  private zoneId: string = 'D75';

  private maille: string = 'REG';

  private codeInsee: string = '01';

  private territoireCode: string = 'REG-01';

  private valeurInitiale: number = 10.1;

  private dateValeurInitiale: Date = new Date('2024-06-12');

  private valeurActuelle: number = 13.4;

  private dateValeurActuelle: Date = new Date('2024-06-20');

  private valeurCibleAnnuelle: number = 20.4;

  private dateValeurCibleAnnuelle: Date = new Date('2024-07-12');

  private tauxAvancementAnnuel: number = 15.3;

  private valeurCibleGlobale: number = 17.8;

  private dateValeurCibleGlobale: Date = new Date('2024-06-12');

  private tauxAvancementGlobale: number = 20.1;

  private estBarometre: boolean = true;

  withIndicId(indicId: string): DonneeIndicateurBuilder {
    this.indicId = indicId;
    return this;
  }

  withZoneId(zoneId: string): DonneeIndicateurBuilder {
    this.zoneId = zoneId;
    return this;
  }

  withMaille(maille: string): DonneeIndicateurBuilder {
    this.maille = maille;
    return this;
  }

  withCodeInsee(codeInsee: string): DonneeIndicateurBuilder {
    this.codeInsee = codeInsee;
    return this;
  }

  withTerritoireCode(maille: string): DonneeIndicateurBuilder {
    this.maille = maille;
    return this;
  }

  withValeurInitiale(valeurInitiale: number): DonneeIndicateurBuilder {
    this.valeurInitiale = valeurInitiale;
    return this;
  }

  withDateValeurInitiale(dateValeurInitiale: Date): DonneeIndicateurBuilder {
    this.dateValeurInitiale = dateValeurInitiale;
    return this;
  }

  withValeurActuelle(valeurActuelle: number): DonneeIndicateurBuilder {
    this.valeurActuelle = valeurActuelle;
    return this;
  }

  withDateValeurActuelle(dateValeurActuelle: Date): DonneeIndicateurBuilder {
    this.dateValeurActuelle = dateValeurActuelle;
    return this;
  }

  withValeurCibleAnnuelle(valeurCibleAnnuelle: number): DonneeIndicateurBuilder {
    this.valeurCibleAnnuelle = valeurCibleAnnuelle;
    return this;
  }

  withDateValeurCibleAnnuelle(dateValeurCibleAnnuelle: Date): DonneeIndicateurBuilder {
    this.dateValeurCibleAnnuelle = dateValeurCibleAnnuelle;
    return this;
  }

  withTauxAvancementAnnuel(tauxAvancementAnnuel: number): DonneeIndicateurBuilder {
    this.tauxAvancementAnnuel = tauxAvancementAnnuel;
    return this;
  }

  withValeurCibleGlobale(valeurCibleGlobale: number): DonneeIndicateurBuilder {
    this.valeurCibleGlobale = valeurCibleGlobale;
    return this;
  }

  withDateValeurCibleGlobale(dateValeurCibleGlobale: Date): DonneeIndicateurBuilder {
    this.dateValeurCibleGlobale = dateValeurCibleGlobale;
    return this;
  }

  withTauxAvancementGlobale(tauxAvancementGlobale: number): DonneeIndicateurBuilder {
    this.tauxAvancementGlobale = tauxAvancementGlobale;
    return this;
  }

  withEstBarometre(estBarometre: boolean): DonneeIndicateurBuilder {
    this.estBarometre = estBarometre;
    return this;
  }

  build(): DonneeIndicateur {
    return DonneeIndicateur.creerDonneeIndicateur({
      indicId: this.indicId,
      zoneId: this.zoneId,
      maille: this.maille,
      codeInsee: this.codeInsee,
      territoireCode: this.territoireCode,
      valeurInitiale: this.valeurInitiale,
      dateValeurInitiale: this.dateValeurInitiale,
      valeurActuelle: this.valeurActuelle,
      dateValeurActuelle: this.dateValeurActuelle,
      valeurCibleAnnuelle: this.valeurCibleAnnuelle,
      dateValeurCibleAnnuelle: this.dateValeurCibleAnnuelle,
      tauxAvancementAnnuel: this.tauxAvancementAnnuel,
      valeurCibleGlobale: this.valeurCibleGlobale,
      dateValeurCibleGlobale: this.dateValeurCibleGlobale,
      tauxAvancementGlobale: this.tauxAvancementGlobale,
      estBarometre: this.estBarometre,
    });
  }
}
