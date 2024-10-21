-- public.profil definition

-- Drop table

-- DROP TABLE public.profil;

CREATE TABLE public.profil (
	code text NOT NULL,
	nom text NOT NULL,
	a_acces_tous_chantiers bool NOT NULL DEFAULT false,
	a_acces_tous_chantiers_territorialises bool NOT NULL DEFAULT false,
	a_acces_tous_les_territoires_lecture bool NOT NULL DEFAULT false,
	a_acces_tous_les_territoires_saisie_commentaire bool NOT NULL DEFAULT false,
	a_acces_tous_les_territoires_saisie_indicateur bool NOT NULL DEFAULT false,
	peut_modifier_les_utilisateurs bool NOT NULL DEFAULT false,
	projets_structurants_lecture_meme_perimetres_que_chantiers bool NOT NULL DEFAULT false,
	projets_structurants_lecture_meme_territoires_que_chantiers bool NOT NULL DEFAULT false,
	projets_structurants_lecture_tous_perimetres bool NOT NULL DEFAULT false,
	projets_structurants_lecture_tous_territoires bool NOT NULL DEFAULT false,
	peut_saisir_des_commentaires bool NOT NULL DEFAULT false,
	a_access_aux_chantiers_brouillons bool NOT NULL DEFAULT false,
	a_acces_a_tous_les_chantiers_utilisateurs bool NOT NULL DEFAULT false,
	a_acces_a_tous_les_territoires_utilisateurs bool NOT NULL DEFAULT false,
	CONSTRAINT profil_pkey PRIMARY KEY (code)
);
