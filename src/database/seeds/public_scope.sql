-- public."scope" definition

-- Drop table

-- DROP TABLE public."scope";

CREATE TABLE public."scope" (
	code text NOT NULL,
	nom text NOT NULL,
	CONSTRAINT scope_pkey PRIMARY KEY (code)
);
