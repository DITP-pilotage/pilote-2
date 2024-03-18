import { Chantier } from '@/server/fiche-conducteur/domain/Chantier';
import { Meteo } from '@/server/fiche-conducteur/domain/Meteo';

export class ChantierBuilder {
  private id: string = 'CH-007';

  private nom: string = 'Nouveau chantier';

  private tauxAvancement: number | null = 10.3;

  private maille: string = 'DEPT';

  private codeInsee: string = '87';

  private meteo: Meteo = 'SOLEIL';

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

  withTauxAvancement(tauxAvancement: number | null): ChantierBuilder {
    this.tauxAvancement = tauxAvancement;
    return this;
  }

  withMaille(maille: string): ChantierBuilder {
    this.maille = maille;
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
      tauxAvancement: this.tauxAvancement,
      maille: this.maille,
      codeInsee: this.codeInsee,
      meteo: this.meteo,
      listeDirecteursAdministrationCentrale: this.listeDirecteursAdministrationCentrale,
      listeDirecteursProjet: this.listeDirecteursProjet,
    });
  }
}
