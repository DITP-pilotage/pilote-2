import {
  chantier_identite as PrismaChantierIdentite,
  chantier_territoire as PrismaChantierTerritoire,
  chantier_territoire_jalon as PrismaChantierTerritoireJalon,
} from '@prisma/client';

type EntreePrismaChantierIdentite = Pick<PrismaChantierIdentite,
'id'
| 'nom'
| 'axe'
| 'ppg'
| 'perimetre_ids'
| 'ate'
| 'ministeres'
| 'statut'
| 'cible_attendue'
| 'est_barometre'
| 'est_territorialise'
| 'possede_taux_avancement_departemental'
| 'possede_taux_avancement_regional'
| 'possede_meteo_departemental'
| 'possede_meteo_regional'
| 'directeurs_administration_centrale'
| 'directions_administration_centrale'
| 'directeurs_projet'
| 'directeurs_projet_mails'
| 'mailles_applicables'
>;
type EntreePrismaChantierTerritoireJalon = Pick<PrismaChantierTerritoireJalon,
'taux_avancement'
>;
type EntreePrismaChantierTerritoire = Pick<PrismaChantierTerritoire,
'territoire_code'
| 'id'
| 'code_insee'
| 'maille'
| 'ecart'
| 'donnees_maille_source'
| 'taux_avancement_mandat_valeur_precedente'
| 'meteo'
| 'tendance'
| 'derniere_maj_date_qualitative'
| 'date_taux_avancement_mandat'
| 'est_applicable'
| 'responsables_locaux'
| 'responsables_locaux_mails'
| 'coordinateurs_territoriaux'
| 'coordinateurs_territoriaux_mails'
| 'taux_avancement_mandat'
>;
export type PrismaChantier = EntreePrismaChantierIdentite  & {
  chantier_territoire: (EntreePrismaChantierTerritoire & { chantier_territoire_jalon: (EntreePrismaChantierTerritoireJalon)[] })[]

};

export type EntreePrismaChantier = EntreePrismaChantierTerritoire & {
  chantier_territoire_jalon: (EntreePrismaChantierTerritoireJalon)[]
};
