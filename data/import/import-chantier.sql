drop table if exists ditp_liste_chantiers_perseverants_avec_trigramme;

create table ditp_liste_chantiers_perseverants_avec_trigramme  (
    liste_des_chantiers_de_perseverance text,
    axe text,
    ppg text,
    ministere text,
    nom_ancienne_reforme_prioritaire text,
    trigrammes_from_id_code text,
    precedent_ministere_responsable text
);

copy ditp_liste_chantiers_perseverants_avec_trigramme
from 'DITP_Liste_chantiers_perseverants-avec-trigramme.csv'
with csv delimiter ',' header;
