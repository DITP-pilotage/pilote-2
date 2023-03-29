-- AlterTable
CREATE SEQUENCE commentaire_id_seq;
ALTER TABLE "commentaire" ALTER COLUMN "id" SET DEFAULT nextval('commentaire_id_seq');
ALTER SEQUENCE commentaire_id_seq OWNED BY "commentaire"."id";
