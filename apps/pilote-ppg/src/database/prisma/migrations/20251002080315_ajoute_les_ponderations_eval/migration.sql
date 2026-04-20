-- AlterTable
ALTER TABLE "raw_data"."metadata_parametrage_indicateurs"
ADD COLUMN "poids_pourcent_eval_dept_declaree" DOUBLE PRECISION,
ADD COLUMN "poids_pourcent_eval_nat_declaree" DOUBLE PRECISION,
ADD COLUMN "poids_pourcent_eval_reg_declaree" DOUBLE PRECISION;

UPDATE "raw_data"."metadata_parametrage_indicateurs"
SET
    "poids_pourcent_eval_dept_declaree" = "poids_pourcent_dept_declaree",
    "poids_pourcent_eval_nat_declaree" = "poids_pourcent_nat_declaree",
    "poids_pourcent_eval_reg_declaree" = "poids_pourcent_reg_declaree";