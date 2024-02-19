import { MeteoDisponible } from '@/server/fiche-territoriale/domain/MeteoDisponible';
import { Ministere } from '@/server/fiche-territoriale/domain/Ministere';
import { MinistereBuilder } from '@/server/fiche-territoriale/app/builders/MinistereBuilder';
import { ChantierFicheTerritoriale } from '@/server/fiche-territoriale/domain/ChantierFicheTerritoriale';

export class ChantierFicheTerritorialeBuilder {
  private tauxAvancement: number | null = 0;

  private meteo: MeteoDisponible | null = null;

  private nom: string = 'Un nom de chantier';

  private ministerePorteur: Ministere = new MinistereBuilder().build();

  private dateQualitative: string = '2023-08-01T00:00:00.000Z';

  private dateQuantitative: string = '2021-08-01T00:00:00.000Z';


  withTauxAvancement(tauxAvancement: number | null): ChantierFicheTerritorialeBuilder {
    this.tauxAvancement = tauxAvancement;
    return this;
  }

  withMeteo(meteo: MeteoDisponible | null): ChantierFicheTerritorialeBuilder {
    this.meteo = meteo;
    return this;
  }

  withNom(nom: string): ChantierFicheTerritorialeBuilder {
    this.nom = nom;
    return this;
  }

  withMinisterePorteur(ministerePorteur: Ministere): ChantierFicheTerritorialeBuilder {
    this.ministerePorteur = ministerePorteur;
    return this;
  }

  withDateQualitative(dateQualitative: string): ChantierFicheTerritorialeBuilder {
    this.dateQualitative = dateQualitative;
    return this;
  }

  withDateQuantitative(dateQuantitative: string): ChantierFicheTerritorialeBuilder {
    this.dateQuantitative = dateQuantitative;
    return this;
  }

  build(): ChantierFicheTerritoriale {
    return ChantierFicheTerritoriale.creerChantierFicheTerritoriale({
      tauxAvancement: this.tauxAvancement,
      meteo: this.meteo,
      nom: this.nom,
      ministerePorteur: this.ministerePorteur,
      dateQualitative: this.dateQualitative,
      dateQuantitative: this.dateQuantitative,
    });
  }
}
