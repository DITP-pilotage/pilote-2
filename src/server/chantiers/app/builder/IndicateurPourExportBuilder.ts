import { IndicateurPourExport } from '@/server/chantiers/domain/IndicateurPourExport';

export class IndicateurPourExportBuilder {
  private maille = 'NAT';

  private régionNom = null;

  private départementNom = null;

  private codeInsee = null;

  private chantierMinistèreNom = null;

  private axe = null;

  private chantierNom = null;

  private chantierId = null;

  private chantierStatut = null;

  private chantierEstBaromètre = null;

  private chantierEstTerritorialise = null;

  private chantierEstApplicable = null;

  private chantierAvancementGlobal = null;

  private chantierAvancementAnnuel = null;

  private périmètreIds = ['PER-001'];

  private météo = null;

  private nom: string = 'Un nom';

  private valeurInitiale = null;

  private dateValeurInitiale = null;

  private valeurActuelle = null;

  private dateValeurActuelle = null;

  private valeurCibleAnnuelle = null;

  private dateValeurCibleAnnuelle = null;

  private avancementAnnuel = null;

  private valeurCible = null;

  private dateValeurCible = null;

  private avancementGlobal = null;

  private estApplicable = true;

  private maillesApplicables = ['NAT', 'REG', 'DEPT'];

  withNom(nom: string) {
    this.nom = nom;
    return this;
  }

  withMaille(maille: string) {
    this.maille = maille;
    return this;
  }

  withPerimetreIds(perimetresIds: string[]) {
    this.périmètreIds = perimetresIds;
    return this;
  }

  public build(): IndicateurPourExport {
    return {
      maille: this.maille,
      régionNom: this.régionNom,
      départementNom: this.départementNom,
      codeInsee: this.codeInsee,
      chantierMinistèreNom: this.chantierMinistèreNom,
      axe: this.axe,
      chantierNom: this.chantierNom,
      chantierId: this.chantierId,
      chantierStatut: this.chantierStatut,
      chantierEstBaromètre: this.chantierEstBaromètre,
      chantierEstTerritorialise: this.chantierEstTerritorialise,
      chantierEstApplicable: this.chantierEstApplicable,
      chantierAvancementGlobal: this.chantierAvancementGlobal,
      chantierAvancementAnnuel: this.chantierAvancementAnnuel,
      périmètreIds: this.périmètreIds,
      météo: this.météo,
      nom: this.nom,
      valeurInitiale: this.valeurInitiale,
      dateValeurInitiale: this.dateValeurInitiale,
      valeurActuelle: this.valeurActuelle,
      dateValeurActuelle: this.dateValeurActuelle,
      valeurCibleAnnuelle: this.valeurCibleAnnuelle,
      dateValeurCibleAnnuelle: this.dateValeurCibleAnnuelle,
      avancementAnnuel: this.avancementAnnuel,
      valeurCible: this.valeurCible,
      dateValeurCible: this.dateValeurCible,
      avancementGlobal: this.avancementGlobal,
      estApplicable: this.estApplicable,
      maillesApplicables: this.maillesApplicables,
    };
  }
}
