-- La slide-in n'a plus de « Plus tard » (décision du 2026-11-23) : la croix la masque sans rien
-- enregistrer. Seules la première présentation et la fermeture sont gardées.
ALTER TABLE "formation_periode_information_utilisateur" DROP COLUMN "date_report";
