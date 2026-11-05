-- Une seule ligne de paramètres, celle que lit le contrôle d'accès.
ALTER TABLE "assistant_parametres" ADD CONSTRAINT "assistant_parametres_id_check" CHECK ("id" = 1);
