import { indicateur_projet_structurant as IndicateurProjetStructurantPrisma, PrismaClient } from '@prisma/client';
import Indicateur, { TypeIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import IndicateurProjetStructurantRepository
  from '@/server/domain/indicateur/IndicateurProjetStructurantRepository.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';

export default class IndicateurProjetStructurantSQLRepository implements IndicateurProjetStructurantRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  
  private _mapperVersDomaine(indicateur: IndicateurProjetStructurantPrisma): Indicateur {
    return {
      id: indicateur.id,
      nom: indicateur.nom,
      type: indicateur.type_id as TypeIndicateur,
      estIndicateurDuBaromètre: false,
      description: indicateur.description,
      source: indicateur.source,
      modeDeCalcul: indicateur.mode_de_calcul,
      unité: null,
    };
  }

  private _mapperDétailsVersDomaine(indicateurs: IndicateurProjetStructurantPrisma[], codeInsee: string): DétailsIndicateurs {
    const détailsIndicateurs: DétailsIndicateurs = {};

    for (const indicateur of indicateurs) {
      if (!détailsIndicateurs[indicateur.id]) {
        détailsIndicateurs[indicateur.id] = {};
      }

      détailsIndicateurs[indicateur.id][codeInsee] = {
        codeInsee: codeInsee,
        valeurInitiale: indicateur.valeur_initiale,
        dateValeurInitiale: indicateur.date_valeur_initiale?.toISOString() ?? null,
        valeurActuelle: indicateur.valeur_actuelle,
        dateValeurActuelle: indicateur.date_valeur_actuelle?.toISOString() ?? null,
        valeurs: indicateur.valeur_actuelle ? [indicateur.valeur_actuelle] : [],
        dateValeurs: indicateur.date_valeur_actuelle ? [indicateur.date_valeur_actuelle.toISOString()] : [],
        valeurCible: indicateur.valeur_cible,
        dateValeurCible: indicateur.date_valeur_cible?.toISOString() ?? null,
        dateValeurCibleAnnuelle: null,
        valeurCibleAnnuelle: null,
        avancement: { annuel: null, global: indicateur.taux_avancement },
        unité: null,
        est_applicable: null,
        dateImport: null,
        pondération: null,
        prochaineDateMaj: null,
        prochaineDateMajJours: null,
        estAJour: null,
      };
    }

    return détailsIndicateurs;
  }
  
  async récupérerParProjetStructurant(projetStructurantId: string, projetStructurantCodeInsee: string): Promise<{ indicateurs: Indicateur[], détails: DétailsIndicateurs }> {
    const indicateurs: IndicateurProjetStructurantPrisma[] = await this.prisma.indicateur_projet_structurant.findMany({
      where: {
        projet_structurant_id: projetStructurantId,
        NOT: {
          type_id: null,
        },
      },
    });
    
    return {
      indicateurs: indicateurs.map(indicateur => this._mapperVersDomaine(indicateur)),
      détails: this._mapperDétailsVersDomaine(indicateurs, projetStructurantCodeInsee),
    };
  }
}
