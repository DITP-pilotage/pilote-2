-- Une période d'information n'est jamais effacée : la supprimer renseigne cette date.
ALTER TABLE "formation_periode_information" ADD COLUMN "deleted_at" TIMESTAMPTZ;
