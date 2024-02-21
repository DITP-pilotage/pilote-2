import { Chantier } from '@/server/fiche-territoriale/domain/Chantier';
import { MeteoDisponible } from '@/server/fiche-territoriale/domain/MeteoDisponible';

export class ChantierBuilder {
  private id: string = 'CH-009';

  private tauxAvancement: number | null = 0;

  private tauxAvancementAnnuel: number | null = 0;

  private meteo: MeteoDisponible | null = null;

  private nom: string = 'Un nom de chantier';

  private codeMinisterePorteur: string = '1009';
  
  withId(id: string): ChantierBuilder {
    this.id = id;
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

  withMeteo(meteo: MeteoDisponible | null): ChantierBuilder {
    this.meteo = meteo;
    return this;
  }

  withNom(nom: string): ChantierBuilder {
    this.nom = nom;
    return this;
  }

  withCodeMinisterePorteur(codeMinisterePorteur: string): ChantierBuilder {
    this.codeMinisterePorteur = codeMinisterePorteur;
    return this;
  }

  build(): Chantier {
    return Chantier.creerChantier({
      id: this.id,
      tauxAvancement: this.tauxAvancement,
      tauxAvancementAnnuel: this.tauxAvancementAnnuel,
      meteo: this.meteo,
      nom: this.nom,
      codeMinisterePorteur: this.codeMinisterePorteur,
    });
  }
}
