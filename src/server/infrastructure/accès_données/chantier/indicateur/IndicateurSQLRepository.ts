import { indicateur as IndicateurPrisma, Prisma, PrismaClient } from '@prisma/client';
import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import Indicateur, { TypeIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import { DétailsIndicateurMailles, DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { groupByAndTransform } from '@/client/utils/arrays';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import {
  IndicateurPourExport,
} from '@/server/usecase/chantier/indicateur/ExportCsvDesIndicateursSansFiltreUseCase.interface';
import { parseDétailsIndicateur } from '@/server/infrastructure/accès_données/chantier/indicateur/IndicateurSQLParser';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';
import { ProfilCode, profilsTerritoriaux } from '@/server/domain/utilisateur/Utilisateur.interface';

class ErreurIndicateurNonTrouvé extends Error {
  constructor(idIndicateur: string) {
    super(`Erreur: indicateur '${idIndicateur}' non trouvé.`);
  }
}

function formatDate(date: Date | null): string | null {
  return date !== null ? date.toISOString() : null;
}

export default class IndicateurSQLRepository implements IndicateurRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private _mapToDomain(indicateur: IndicateurPrisma): Indicateur {
    return ({
      id: indicateur.id,
      nom: indicateur.nom,
      type: indicateur.type_id as TypeIndicateur,
      estIndicateurDuBaromètre: indicateur.est_barometre ?? false,
      description: indicateur.description,
      source: indicateur.source,
      modeDeCalcul: indicateur.mode_de_calcul,
      unité: indicateur.unite_mesure,
    });
  }

  private _mapDétailsToDomain(indicateurs: IndicateurPrisma[]): DétailsIndicateurs {
    const détailsIndicateurs: DétailsIndicateurs = {};

    let IntermediaireEstAnnéeEnCours: boolean;
    for (const indic of indicateurs) {
      IntermediaireEstAnnéeEnCours = indic.objectif_date_valeur_cible_intermediaire?.getFullYear() === new Date().getFullYear();

      if (!détailsIndicateurs[indic.id]) {
        détailsIndicateurs[indic.id] = {};
      }

      détailsIndicateurs[indic.id][indic.code_insee] = {
        codeInsee: indic.code_insee,
        valeurInitiale: indic.valeur_initiale,
        dateValeurInitiale: formatDate(indic.date_valeur_initiale),
        valeurs: indic.evolution_valeur_actuelle ?? [],
        dateValeurs: indic.evolution_date_valeur_actuelle.map((date) => date.toISOString()) ?? [],
        valeurActuelle: indic.valeur_actuelle,
        dateValeurActuelle: formatDate(indic.date_valeur_actuelle),
        valeurCible: indic.objectif_valeur_cible,
        dateValeurCible: formatDate(indic.objectif_date_valeur_cible),
        valeurCibleAnnuelle: IntermediaireEstAnnéeEnCours ? indic.objectif_valeur_cible_intermediaire : null,
        dateValeurCibleAnnuelle: IntermediaireEstAnnéeEnCours ? formatDate(indic.objectif_date_valeur_cible_intermediaire) : null,
        avancement: {
          global: indic.objectif_taux_avancement,
          annuel: IntermediaireEstAnnéeEnCours ? indic.objectif_taux_avancement_intermediaire : null,
        },
        unité: indic.unite_mesure,
        est_applicable: indic.est_applicable,
        dateImport: formatDate(indic.dernier_import_date_indic),
        pondération: indic.ponderation_zone_reel,
        prochaineDateMaj: formatDate(indic.prochaine_date_maj),
        prochaineDateMajJours: indic.prochaine_date_maj_jours,
        estAJour: indic.est_a_jour,
      };
    }

    return détailsIndicateurs;
  }
  
  async récupérerChantierIdAssocié(id: string): Promise<string> {
    const indicateur = await this.prisma.indicateur.findFirst({
      where: {
        id,
      },
    });

    return indicateur!.chantier_id;
  }

  async récupérerDétailsParMailles(id: string, habilitations: Habilitations, profil: ProfilCode): Promise<DétailsIndicateurMailles> {
    const h = new Habilitation(habilitations);
    const chantiersLecture = h.récupérerListeChantiersIdsAccessiblesEnLecture();

    let paramètresRequête : Prisma.indicateurFindManyArgs = {
      where: {
        id,
        chantier_id: { in: chantiersLecture },
      },
    } ;

    if (!profilsTerritoriaux.includes(profil)) {
      const territoiresLecture = h.récupérerListeTerritoireCodesAccessiblesEnLecture();

      paramètresRequête.where!.territoire_code = { in: territoiresLecture };
    }

    const indicateur = await this.prisma.indicateur.findMany(paramètresRequête);

    if (!indicateur || indicateur.length === 0) {
      throw new ErreurIndicateurNonTrouvé(id);
    }

    const territoires = await this.prisma.territoire.findMany();

    return parseDétailsIndicateur(indicateur, territoires);
  }

  async récupérerGroupésParChantier(chantiersIds: Chantier['id'][], maille: Maille, codeInsee: CodeInsee): Promise<Record<string, Indicateur[]>> {
    const indicateurs: IndicateurPrisma[] = await this.prisma.indicateur.findMany({
      where: {
        chantier_id: { in: chantiersIds },
        maille: CODES_MAILLES[maille],
        code_insee: codeInsee,
        NOT: {
          type_id : null,
        },
      },
    });

    return groupByAndTransform(
      indicateurs,
      (indicateur) => indicateur.chantier_id,
      this._mapToDomain,
    );
  }

  async récupérerDétailsGroupésParChantierEtParIndicateur(chantiersIds: Chantier['id'][], maille: Maille, codeInsee: CodeInsee): Promise<Record<Chantier['id'], DétailsIndicateurs>> {
    const indicateurs: IndicateurPrisma[] = await this.prisma.indicateur.findMany({
      where: {
        chantier_id: { in: chantiersIds },
        maille: CODES_MAILLES[maille],
        code_insee: codeInsee,
        NOT: {
          type_id : null,
        },
      },
    });  

    return Object.fromEntries(
      indicateurs.map(indicateur => (
        [
          indicateur.chantier_id,
          this._mapDétailsToDomain(indicateurs.filter(ind => ind.chantier_id === indicateur.chantier_id)),
        ]
      )),
    );
  }

  async récupérerParChantierId(chantierId: string): Promise<Indicateur[]> {
    const indicateurs: IndicateurPrisma[] = await this.prisma.indicateur.findMany({
      where: {
        chantier_id: chantierId,
        maille: 'NAT',
        NOT: {
          type_id : null,
        },
      },
    });
    
    return indicateurs.map((indicateur) => this._mapToDomain(indicateur));
  }

  async récupérerDétails(indicateurId: string, maille: Maille): Promise<DétailsIndicateurs> {
    const indicateurs: IndicateurPrisma[] = await this.prisma.indicateur.findMany({
      where: { 
        id: indicateurId,
        maille: CODES_MAILLES[maille],
        NOT: {
          type_id : null,
        },
      },
    });

    return this._mapDétailsToDomain(indicateurs);
  }

  async récupererDétailsParChantierIdEtTerritoire(chantierId: string, territoireCodes: string[]): Promise<DétailsIndicateurs> {
    const { maille } = territoireCodeVersMailleCodeInsee(territoireCodes[0]);
    const codesInsee = territoireCodes.map(territoireCode => territoireCodeVersMailleCodeInsee(territoireCode).codeInsee);

    const indicateurs: IndicateurPrisma[] = await this.prisma.indicateur.findMany({
      where: {
        chantier_id: chantierId,
        maille,
        code_insee: { in: codesInsee },
        NOT: {
          type_id : null,
        },
      },
    });
    return this._mapDétailsToDomain(indicateurs);
  }

  async récupérerPourExports(chantierIdsLecture: string[], territoireCodesLecture: string[]): Promise<IndicateurPourExport[]> {

    const rows = await this.prisma.$queryRaw<any[]>`
      with chantier_ids as (
              select distinct c.id
              from chantier c
              where c.id in (${Prisma.join(chantierIdsLecture)})
                and ministeres <> '{}'
          ),
          dernieres_syntheses as (
              select *
              from (
                      select s.*,
                      row_number() over (
                          partition by chantier_id, maille, code_insee order by date_commentaire desc
                      ) r
                      from synthese_des_resultats s
                      where date_commentaire is not null
                  ) sr
              where sr.r = 1
          )
      
      select i.maille                                   maille,
             t_r.nom                                    region_nom,
             t_d.nom                                    departement_nom,
             c.ministeres                               chantier_ministeres,
             c.ministeres_acronymes                     chantier_ministeres_acronymes,
             c.axe                                      axe,
             c.nom                                      chantier_nom,
             c.id                                       chantier_id,
             c.statut                                   chantier_statut,
             c.est_barometre                            chantier_est_barometre,
             c.est_territorialise                       chantier_est_territorialise,
             c.taux_avancement                          chantier_taux_avancement,
             c.perimetre_ids                            perimetre_ids,
             s.meteo                                    meteo,
             i.nom                                      nom,
             i.valeur_initiale                          valeur_initiale,
             i.date_valeur_initiale                     date_valeur_initiale,
             i.valeur_actuelle                          valeur_actuelle,
             i.date_valeur_actuelle                     date_valeur_actuelle,
             i.objectif_valeur_cible_intermediaire      valeur_cible_annuelle,
             i.objectif_date_valeur_cible_intermediaire date_valeur_cible_annuelle,
             i.objectif_taux_avancement_intermediaire   taux_avancement_annuel,
             i.objectif_valeur_cible                    valeur_cible,
             i.objectif_date_valeur_cible               date_valeur_cible,
             i.objectif_taux_avancement                 taux_avancement
      
      from chantier_ids cids
               inner join territoire t on t.code in (${Prisma.join(territoireCodesLecture)})
               inner join indicateur i on i.chantier_id = cids.id and lower(i.maille) = cast(t.maille as text) and i.code_insee = t.code_insee and i.type_id is not null
               left outer join chantier c on c.id = cids.id and c.territoire_code = t.code
               left outer join chantier c_r on (c_r.id = cids.id and c_r.maille = 'REG')
                                            and (c_r.territoire_code = t.code or c_r.territoire_code = t.code_parent)
               left outer join chantier c_d on c_d.id = cids.id and c_d.maille = 'DEPT' and c_d.territoire_code = t.code
               left outer join territoire t_r on t_r.code = c_r.territoire_code
               left outer join territoire t_d on t_d.code = c_d.territoire_code
               left outer join dernieres_syntheses s
                               on s.chantier_id = c.id and s.maille = c.maille and s.code_insee = c.code_insee
      where c.id is not null
      and i.est_applicable
      order by
          c.nom,
          i.nom,
          CASE i.maille
            WHEN 'NAT' THEN 1
            WHEN 'REG' THEN 2
            WHEN 'DEPT' THEN 3
            ELSE 4 END,
          region_nom,
          t_d.code_insee, -- on ordonne en fonction du numéro du département et pas par ordre alphabétique (le Haut-Rhin vient juste après le Bas-Rhin)
          c.ministeres
    `;

    return rows.map(it => ({
      maille: it.maille,
      régionNom: it.region_nom,
      départementNom: it.departement_nom,
      chantierMinistèreNom: it.chantier_ministeres_acronymes ? it.chantier_ministeres_acronymes[0] : null,
      axe: it.axe,
      chantierNom: it.chantier_nom,
      chantierId: it.chantier_id,
      statut: it.chantier_statut,
      chantierStatut: it.chantier_statut,
      chantierEstBaromètre: it.chantier_est_barometre,
      chantierEstTerritorialise: it.chantier_est_territorialise,
      chantierAvancementGlobal: it.chantier_taux_avancement,
      périmètreIds: it.perimetre_ids,
      météo: it.meteo,
      nom: it.nom,
      valeurInitiale: it.valeur_initiale,
      dateValeurInitiale: it.date_valeur_initiale,
      valeurActuelle: it.valeur_actuelle,
      dateValeurActuelle: it.date_valeur_actuelle,
      valeurCibleAnnuelle: it.valeur_cible_annuelle,
      dateValeurCibleAnnuelle: it.date_valeur_cible_annuelle,
      avancementAnnuel: it.taux_avancement_annuel,
      valeurCible: it.valeur_cible,
      dateValeurCible: it.date_valeur_cible,
      avancementGlobal: it.taux_avancement,
    }));
  }
}
