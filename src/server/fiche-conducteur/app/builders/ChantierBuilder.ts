import { Chantier } from '@/server/fiche-conducteur/domain/Chantier';
import { Meteo } from '@/server/fiche-conducteur/domain/Meteo';

export class ChantierBuilder {
  private id: string = 'CH-007';

  private nom: string = 'Nouveau chantier';

  private estTerritorialise: boolean = false;

  private tauxAvancement: number | null = 10.3;

  private tauxAvancementAnnuel: number | null = 15.3;

  private maille: string = 'DEPT';

  private codeInsee: string = '87';

  private meteo: Meteo = 'SOLEIL';

  private estApplicable: boolean = false;

  private listeDirecteursAdministrationCentrale: string[] = [];

  private listeDirecteursProjet: string[] = [];

  withId(id: string): ChantierBuilder {
    this.id = id;
    return this;
  }

  withCodeInsee(codeInsee: string) : ChantierBuilder {
    this.codeInsee = codeInsee;
    return this;
  }

  withMeteo(meteo: Meteo) : ChantierBuilder {
    this.meteo = meteo;
    return this;
  }

  withNom(nom: string): ChantierBuilder {
    this.nom = nom;
    return this;
  }

  withEstTerritorialise(estTerritorialise: boolean): ChantierBuilder {
    this.estTerritorialise = estTerritorialise;
    return this;
  }

  withTauxAvancement(tauxAvancement: number | null): ChantierBuilder {
    this.tauxAvancement = tauxAvancement;
    return this;
  }

  withTauxAvancementAnnuel(tauxAvancementAnnuel: number | null): ChantierBuilder {
    this.tauxAvancementAnnuel = tauxAvancementAnnuel;
    return this;
  }

  withMaille(maille: string): ChantierBuilder {
    this.maille = maille;
    return this;
  }

  withEstApplicable(estApplicable: boolean): ChantierBuilder {
    this.estApplicable = estApplicable;
    return this;
  }

  withListeDirecteursAdministrationCentrale(...listeDirecteursAdministrationCentrale: string[]): ChantierBuilder {
    this.listeDirecteursAdministrationCentrale = listeDirecteursAdministrationCentrale;
    return this;
  }

  withListeDirecteursProjet(...listeDirecteursProjet: string[]): ChantierBuilder {
    this.listeDirecteursProjet = listeDirecteursProjet;
    return this;
  }

  build(): Chantier {
    return Chantier.creerChantier({
      id: this.id,
      nom: this.nom,
      estTerritorialise: this.estTerritorialise,
      tauxAvancement: this.tauxAvancement,
      tauxAvancementAnnuel: this.tauxAvancementAnnuel,
      maille: this.maille,
      codeInsee: this.codeInsee,
      meteo: this.meteo,
      estApplicable: this.estApplicable,
      listeDirecteursAdministrationCentrale: this.listeDirecteursAdministrationCentrale,
      listeDirecteursProjet: this.listeDirecteursProjet,
    });
  }
}
