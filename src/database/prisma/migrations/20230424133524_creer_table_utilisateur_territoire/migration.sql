-- AlterTable
ALTER TABLE "public"."profil" ADD COLUMN     "a_acces_tous_chantiers_territorialises" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."utilisateur_territoire" (
    "utilisateur_id" UUID NOT NULL,
    "territoire_code" TEXT NOT NULL,

    CONSTRAINT "utilisateur_territoire_pkey" PRIMARY KEY ("utilisateur_id","territoire_code")
);

-- AddForeignKey
ALTER TABLE "public"."utilisateur_territoire" ADD CONSTRAINT "utilisateur_territoire_territoire_code_fkey" FOREIGN KEY ("territoire_code") REFERENCES "public"."territoire"("code") ON DELETE CASCADE ON UPDATE CASCADE;
