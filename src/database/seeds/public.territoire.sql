-- public.territoire definition

-- Drop table

-- DROP TABLE public.territoire;

CREATE TABLE public.territoire (
	code text NOT NULL,
	nom text NOT NULL,
	nom_affiche text NOT NULL,
	"maille" public."maille" NOT NULL,
	code_insee text NOT NULL,
	code_parent text NULL,
	zone_id text NOT NULL,
	CONSTRAINT territoire_pkey PRIMARY KEY (code)
);
